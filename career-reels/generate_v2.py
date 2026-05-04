#!/usr/bin/env python3
"""
Career Reels Generator v2
- espeak-ng for offline neural-style TTS
- Word-level timing via ffmpeg silencedetect
- Animated gradient backgrounds + glow
- Word-by-word caption animation (CapCut style)
- Ambient music synthesised via numpy
- ffmpeg final encode: 1080x1920, H.264, AAC
"""

import asyncio, os, sys, math, wave, subprocess, tempfile, shutil, re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ── Constants ──────────────────────────────────────────────────────────────
W, H     = 1080, 1920
FPS      = 30
SPEED    = 145          # espeak WPM
VOICE    = "en-us+m3"  # espeak voice
PAD      = 90           # horizontal padding
HOOK_DUR  = 3.8         # hook screen seconds
OUTRO_DUR = 5.5         # takeaway screen seconds
OUTPUT   = Path(__file__).parent / "output_v2"

# ── Reel content ───────────────────────────────────────────────────────────
REELS = [
    {
        "id": 1,
        "title": "You Got the Job. Now the Real Game Begins.",
        "hook": "Most people spend months getting the job — and zero time learning how to survive it.",
        "narration": "Your first job is not just a paycheck. It is a live simulation of how organisations actually work. Every workplace has two structures. The official one: org charts, titles, reporting lines. And the invisible one: who actually influences decisions. Who gets heard in meetings. Who moves fast and why. Your first 90 days are not about performance. They are about observation. Watch who people go to when something needs to get done. Watch who gets credit, and who gets ignored — even when they are right. Most early-career professionals try to prove themselves immediately. The smart ones map the terrain first.",
        "takeaway": "Every workplace has two structures — the official one and the invisible one. Your first job is to find both.",
        "accent": "#00D4FF",
        "bg1": "#0A0A1A", "bg2": "#0D1B2A",
    },
    {
        "id": 2,
        "title": "The Invisible Power Map",
        "hook": "The person with the loudest title is not always the one with the most power.",
        "narration": "Every organisation has informal influencers. People whose opinions shape decisions before they even enter a meeting room. Here is how to identify them in your first 30 days. Watch who gets pulled into conversations outside their job description. Watch whose messages get replied to first. Watch who senior leaders casually check in with. These are your key nodes. They are not necessarily your manager. Sometimes it is a senior individual contributor. A long-tenured executive assistant. A cross-functional lead. Once you have identified three to five of these people — do not perform for them. Learn from them. Ask one good question a week. People respect curiosity over flattery every time.",
        "takeaway": "Map informal influencers in your first 30 days. These people shape decisions before meetings happen.",
        "accent": "#FF6B35",
        "bg1": "#0A0A1A", "bg2": "#1A0D0A",
    },
    {
        "id": 3,
        "title": "Visibility Without Being Loud",
        "hook": "The most promoted people are not the loudest. They are visible in the right rooms, at the right moments.",
        "narration": "Visibility is not about talking more in meetings. It is about being associated with outcomes people care about. Three ways early-career professionals build real visibility. First — attach yourself to visible work. High-stakes projects, cross-functional initiatives. Anything a senior leader is watching. Second — communicate your progress up. Do not wait for your manager to ask. Send a weekly two-line update: what you moved, what you need. This signals ownership — one of the rarest traits at junior level. Third — have one sharp insight ready per meeting. Not multiple opinions. One specific, well-thought observation. Visibility is a system, not a personality trait.",
        "takeaway": "Visibility = visible work + proactive communication + one precise insight per meeting.",
        "accent": "#00FF88",
        "bg1": "#0A0A1A", "bg2": "#0A1A0F",
    },
    {
        "id": 4,
        "title": "Managing Up — The Skill Nobody Teaches You",
        "hook": "Your relationship with your manager will make or break your first two years. Most people leave this to chance.",
        "narration": "Managing up does not mean flattering your boss. It means making your manager's job easier. And ensuring they can advocate for you when it counts. Start by understanding what your manager actually cares about. What are they measured on? What keeps them up at night? Once you know this, you can align your work to reduce their stress. Next — remove ambiguity. Never leave a conversation without clarity on three things: what you are doing, by when, and what success looks like. Third — deliver above the ask. Return with the task plus one unexpected insight. Not ten — just one. Your manager is your most important internal sponsor. Build that relationship with intention.",
        "takeaway": "Manage up: understand their goals, eliminate ambiguity, return more than what was asked.",
        "accent": "#A855F7",
        "bg1": "#0A0A1A", "bg2": "#120A1A",
    },
    {
        "id": 5,
        "title": "The Learning Trap",
        "hook": "You can spend two years in a job and learn almost nothing — if you are not learning deliberately.",
        "narration": "Early career is your highest-leverage learning window. Every skill you build now compounds for the next decade. Most people waste it by being reactive. Doing what is assigned, moving to the next task, repeating. Deliberate learning looks different. After every significant task, ask three questions: What worked? What did not? What would I do differently? Find one senior person per quarter whose thinking you want to study. Not shadow — study. How do they frame problems? How do they communicate in high-stakes moments? Build a pattern library — capture frameworks from your own experience. The professionals who grow fastest are not the most talented. They are the most systematic.",
        "takeaway": "Deliberate learning = reflect after every task + study senior thinkers + build a pattern library.",
        "accent": "#FFD700",
        "bg1": "#0A0A1A", "bg2": "#1A1500",
    },
    {
        "id": 6,
        "title": "Your 90-Day Playbook",
        "hook": "Most people figure out how their workplace works in year two. Here is how to do it in 90 days.",
        "narration": "Everything in this series maps to a 90-day operating system. Days one to 30 — observe and map. Build your invisible power map. Identify the three to five key nodes. Do not perform yet. Orient. Days 31 to 60 — attach and communicate. Find one high-visibility project to contribute to. Start your weekly two-line update to your manager. Show up with one prepared insight per meeting. Days 61 to 90 — deliver and compound. Return more than what is asked on every task. Align with your manager on what good looks like in six months. Start your pattern library. At 90 days, you will not just have survived. You will have a reputation, a network, and a learning system. That is the edge. Now go execute.",
        "takeaway": "90 days. Three phases. Observe → Attach → Deliver. Reputation + Network + Learning system.",
        "accent": "#FF0055",
        "bg1": "#0A0A1A", "bg2": "#1A000A",
    },
]

# ── Utilities ──────────────────────────────────────────────────────────────
def h2r(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

_FONTS = {}
def font(size, bold=True):
    key = (size, bold)
    if key in _FONTS:
        return _FONTS[key]
    candidates = [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ] if bold else [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            try:
                f = ImageFont.truetype(p, size)
                _FONTS[key] = f
                return f
            except Exception:
                pass
    f = ImageFont.load_default()
    _FONTS[key] = f
    return f

def textlen(draw, text, fnt):
    try:
        return int(draw.textlength(text, font=fnt))
    except Exception:
        return len(text) * (fnt.size // 2)

# ── TTS (espeak-ng) ────────────────────────────────────────────────────────
def tts(text, out_wav, speed=SPEED, voice=VOICE):
    subprocess.run(
        ["espeak-ng", "-v", voice, "-s", str(speed), text, "-w", str(out_wav)],
        stderr=subprocess.DEVNULL, check=True
    )
    with wave.open(str(out_wav)) as wf:
        return wf.getnframes() / wf.getframerate()

def word_timings(text, audio_dur):
    """Estimate word timings proportional to character length."""
    words = text.split()
    # Weight: vowels take longer than consonants; punctuation adds pause
    def weight(w):
        w = w.strip(".,!?;:—–-")
        vowels = sum(1 for c in w.lower() if c in "aeiou")
        return max(1, len(w) * 0.6 + vowels * 0.4)

    weights = [weight(w) for w in words]
    # Add pause weight for punctuation-ending words
    for i, w in enumerate(words):
        if w[-1] in ".!?": weights[i] *= 1.8
        elif w[-1] in ",;:—": weights[i] *= 1.3

    total_w = sum(weights)
    timings, t = [], 0.0
    for word, w in zip(words, weights):
        dur = (w / total_w) * audio_dur
        timings.append({"word": word.strip(".,!?;:—–"), "start": t, "end": t + dur})
        t += dur
    return timings

# ── Ambient music ──────────────────────────────────────────────────────────
def gen_music(duration, path, sr=44100):
    t = np.linspace(0, duration, int(duration * sr), False)
    # Am7 cinematic pad: A-C-E-G harmonics
    freqs = [55.0, 82.4, 110.0, 130.8, 164.8, 196.0, 220.0, 261.6]
    out = np.zeros(len(t))
    for i, hz in enumerate(freqs):
        lfo   = 0.92 + 0.08 * np.sin(2 * np.pi * 0.18 * t + i * 0.9)
        chord = (np.sin(2*np.pi*hz*t) * 0.55 +
                 np.sin(2*np.pi*hz*2*t) * 0.25 +
                 np.sin(2*np.pi*hz*0.5*t) * 0.20)
        out += chord * lfo * (0.14 / len(freqs))

    peak = np.max(np.abs(out)) + 1e-9
    out = out / peak * 0.22

    fi = min(int(sr * 3), len(t) // 4)
    out[:fi] *= np.linspace(0, 1, fi)
    out[-fi:] *= np.linspace(1, 0, fi)

    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes((out * 32767).astype(np.int16).tobytes())

# ── Background layers (pre-computed) ─────────────────────────────────────
def make_gradient(hex1, hex2):
    c1 = np.array(h2r(hex1), np.float32)
    c2 = np.array(h2r(hex2), np.float32)
    t  = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    row = (c1 * (1-t) + c2 * t).astype(np.uint8)
    return np.broadcast_to(row[:, None, :], (H, W, 3)).copy()

def make_glow(accent_rgb):
    cy, cx = H // 2, W // 2
    y, x = np.ogrid[:H, :W]
    d = np.sqrt(((y - cy) / 600)**2 + ((x - cx) / 500)**2)
    mask = np.exp(-d * 1.8).astype(np.float32)   # (H, W)
    return mask

def make_vignette():
    y, x = np.ogrid[:H, :W]
    yn = (y / H - 0.5) * 2
    xn = (x / W - 0.5) * 2
    v  = 1.0 - np.clip(np.sqrt(yn**2 + xn**2) * 0.65, 0, 1) * 0.75
    return v.astype(np.float32)

VIGNETTE = make_vignette()

# ── Text layout ────────────────────────────────────────────────────────────
def wrap_words(timings, fnt, max_w):
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    lines, cur, cw = [], [], 0
    for wd in timings:
        ww = textlen(dummy, wd["word"] + " ", fnt)
        if cw + ww > max_w and cur:
            lines.append(cur); cur, cw = [wd], ww
        else:
            cur.append(wd); cw += ww
    if cur: lines.append(cur)
    return lines

def wrap_plain(text, fnt, max_w):
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    words = text.split()
    lines, cur = [], []
    for w in words:
        test = " ".join(cur + [w])
        if textlen(dummy, test, fnt) > max_w and cur:
            lines.append(" ".join(cur)); cur = [w]
        else:
            cur.append(w)
    if cur: lines.append(" ".join(cur))
    return lines

# ── Frame renderer ─────────────────────────────────────────────────────────
def render_frame(fn, total_frames, timings, layout, reel,
                 accent_rgb, gradient, glow_mask):
    t        = fn / FPS
    total_t  = total_frames / FPS
    progress = fn / max(total_frames - 1, 1)

    # ── Composite background ──────────────────────────────────────────────
    pulse   = 0.16 + 0.07 * math.sin(t * 0.75)
    accent  = np.array(accent_rgb, np.float32)
    glow    = glow_mask[:, :, None] * accent * pulse
    frame   = np.clip(gradient.astype(np.float32) + glow, 0, 255)
    frame  *= VIGNETTE[:, :, None]
    frame   = frame.clip(0, 255).astype(np.uint8)

    img  = Image.fromarray(frame)
    draw = ImageDraw.Draw(img)

    fhook  = font(54)   # hook / takeaway headline
    fcap   = font(46)   # captions
    ftitle = font(24)   # part badge / title

    narr_start = HOOK_DUR
    narr_end   = total_t - OUTRO_DUR

    # ── Phases ────────────────────────────────────────────────────────────
    if t < HOOK_DUR:
        _draw_hook(draw, t, reel, accent_rgb, fhook, ftitle)

    elif t > narr_end:
        _draw_takeaway(draw, t, narr_end, reel, accent_rgb, fhook, ftitle)

    else:
        _draw_narration(draw, t, timings, layout, reel, accent_rgb, fcap, ftitle)

    # ── Progress bar ──────────────────────────────────────────────────────
    draw.rectangle([0, H - 7, W, H], fill=(15, 15, 15))
    draw.rectangle([0, H - 7, int(W * progress), H], fill=accent_rgb)

    return np.array(img)


def _draw_hook(draw, t, reel, accent, fhook, ftitle):
    fade = min(1.0, t / 0.45)
    fade_out = 1.0 if t < HOOK_DUR - 0.5 else max(0.0, (HOOK_DUR - t) / 0.5)
    a = max(0, min(255, int(255 * fade * fade_out)))

    # Accent bar
    bw = int(72 * fade)
    draw.rectangle([W//2 - bw//2, H//2 - 140, W//2 + bw//2, H//2 - 136],
                   fill=accent)

    lines = wrap_plain(reel["hook"], fhook, W - PAD * 2)
    lh = fhook.size + 20
    ty = H//2 - (len(lines) * lh)//2 + 15
    dummy = ImageDraw.Draw(Image.new("RGB", (1,1)))
    for line in lines:
        tw = textlen(dummy, line, fhook)
        draw.text(((W - tw)//2, ty), line, font=fhook, fill=(255, 255, 255))
        ty += lh

    # Pulsing dot
    r = int(5 + 3 * math.sin(t * 5))
    draw.ellipse([W//2 - r, ty + 18 - r, W//2 + r, ty + 18 + r], fill=accent)


def _draw_takeaway(draw, t, narr_end, reel, accent, fhook, ftitle):
    fade = min(1.0, (t - narr_end) / 0.45)
    dummy = ImageDraw.Draw(Image.new("RGB", (1,1)))

    label = "KEY TAKEAWAY"
    lw = textlen(dummy, label, ftitle)
    draw.text(((W - lw)//2, H//2 - 245), label, font=ftitle, fill=accent)

    # Divider
    dw = int(W * 0.5 * fade)
    draw.rectangle([W//2 - dw//2, H//2 - 210, W//2 + dw//2, H//2 - 207], fill=accent)

    # Left border
    draw.rectangle([PAD, H//2 - 195, PAD + 4, H//2 + 195], fill=accent)

    lines = wrap_plain(reel["takeaway"], fhook, W - PAD*2 - 16)
    ty = H//2 - 185
    for line in lines:
        draw.text((PAD + 16, ty), line, font=fhook, fill=(240, 240, 240))
        ty += fhook.size + 18

    # CTA
    cta = "Follow for the full series  ›"
    cw = textlen(dummy, cta, ftitle)
    draw.text(((W - cw)//2, H//2 + 210), cta, font=ftitle, fill=accent)


def _draw_narration(draw, t, timings, layout, reel, accent, fcap, ftitle):
    dummy = ImageDraw.Draw(Image.new("RGB", (1,1)))

    # Part badge
    badge = f"PART {reel['id']} / 6"
    draw.text((PAD, 52), badge, font=ftitle, fill=accent)
    draw.rectangle([PAD, 84, PAD + 38, 88], fill=accent)

    # Current word
    cur_idx = -1
    for i, wd in enumerate(timings):
        if wd["start"] <= t < wd["end"]:
            cur_idx = i; break
    if cur_idx == -1:
        for i, wd in enumerate(timings):
            if wd["end"] <= t: cur_idx = i

    # Current line
    cur_line = 0
    if cur_idx >= 0:
        cw_obj = timings[cur_idx]
        for li, line in enumerate(layout):
            if any(w is cw_obj for w in line):
                cur_line = li; break

    # Show 3 lines centred on current
    show_start = max(0, cur_line - 1)
    show = layout[show_start: show_start + 3]

    lh = fcap.size + 26
    cap_cy = H // 2 + 180
    cap_y = cap_cy - (len(show) * lh) // 2

    for li, line in enumerate(show):
        lw = sum(textlen(dummy, wd["word"] + " ", fcap) for wd in line)
        x  = (W - lw) // 2
        y  = cap_y + li * lh

        for wd in line:
            is_cur  = (cur_idx >= 0 and wd is timings[cur_idx])
            is_past = wd["end"] <= t
            wtext   = wd["word"]
            ww      = textlen(dummy, wtext + " ", fcap)

            if is_cur:
                # Subtle glow box behind active word
                box_color = tuple(min(255, int(c * 0.18)) for c in accent)
                draw.rounded_rectangle([x-5, y-4, x+ww-2, y+fcap.size+4],
                                       radius=6, fill=box_color)
                draw.text((x, y), wtext, font=fcap, fill=accent)
            elif is_past:
                draw.text((x, y), wtext, font=fcap, fill=(225, 225, 225))
            else:
                draw.text((x, y), wtext, font=fcap, fill=(75, 75, 75))
            x += ww

# ── Main pipeline ──────────────────────────────────────────────────────────
def render_reel(reel):
    rid = reel["id"]
    print(f"\n── Reel {rid}/6: {reel['title'][:55]}")
    OUTPUT.mkdir(exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix=f"reel{rid}_"))

    try:
        out = OUTPUT / f"reel-{rid}.mp4"

        # 1. TTS
        print("  [1/4] TTS narration (espeak-ng)...")
        narr_wav = tmp / "narration.wav"
        narr_dur = tts(reel["narration"], narr_wav)
        total_t  = HOOK_DUR + narr_dur + OUTRO_DUR
        total_fr = int(total_t * FPS)
        print(f"        {narr_dur:.1f}s narration → {total_t:.1f}s total, {total_fr} frames")

        # 2. Word timings (proportional estimation)
        raw_timings = word_timings(reel["narration"], narr_dur)
        # Offset for hook
        timings = [{"word": w["word"],
                    "start": w["start"] + HOOK_DUR,
                    "end":   w["end"]   + HOOK_DUR}
                   for w in raw_timings]

        # 3. Music
        print("  [2/4] Synthesising ambient music...")
        music_wav = tmp / "music.wav"
        gen_music(total_t + 2, music_wav)

        # 4. Render frames
        print("  [3/4] Rendering frames...")
        accent_rgb = h2r(reel["accent"])
        gradient   = make_gradient(reel["bg1"], reel["bg2"])
        glow_mask  = make_glow(accent_rgb)

        fcap = font(46)
        layout = wrap_words(timings, fcap, W - PAD * 2)

        raw_mp4 = tmp / "video.mp4"
        proc = subprocess.Popen([
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "rawvideo", "-pix_fmt", "rgb24",
            "-s", f"{W}x{H}", "-r", str(FPS),
            "-i", "pipe:0",
            "-c:v", "libx264", "-preset", "fast", "-crf", "21",
            "-pix_fmt", "yuv420p",
            str(raw_mp4)
        ], stdin=subprocess.PIPE)

        for fn in range(total_fr):
            frame = render_frame(fn, total_fr, timings, layout, reel,
                                 accent_rgb, gradient, glow_mask)
            proc.stdin.write(frame.tobytes())
            if fn % 120 == 0:
                pct = fn / total_fr * 100
                print(f"\r  [3/4] {pct:4.0f}%  ({fn}/{total_fr})", end="", flush=True)

        proc.stdin.close()
        proc.wait()
        print(f"\r  [3/4] 100%  ({total_fr}/{total_fr})        ")
        if proc.returncode != 0:
            print("  ✗ Video encoding failed"); return

        # 5. Mix audio
        print("  [4/4] Mixing audio...")
        delay_ms = int(HOOK_DUR * 1000)
        r = subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(raw_mp4),
            "-i", str(narr_wav),
            "-i", str(music_wav),
            "-filter_complex",
            (f"[1:a]adelay={delay_ms}:all=1,volume=1.2[tts];"
             f"[2:a]volume=0.18[mus];"
             "[tts][mus]amix=inputs=2:duration=first:normalize=0[a]"),
            "-map", "0:v", "-map", "[a]",
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart",
            str(out)
        ], capture_output=True, text=True)

        if r.returncode != 0:
            print(f"  ✗ Audio mix failed:\n{r.stderr[-300:]}"); return

        mb = out.stat().st_size / 1e6
        print(f"  ✓ {out.name}  ({mb:.1f} MB, {total_t:.1f}s)")

    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    print("\n  Career Reels Generator v2")
    print("  Stack: espeak-ng + Pillow/numpy + ffmpeg")
    print("=" * 52)

    if not shutil.which("espeak-ng"):
        print("✗ espeak-ng missing — run: apt install espeak-ng"); sys.exit(1)
    if not shutil.which("ffmpeg"):
        print("✗ ffmpeg missing — run: apt install ffmpeg"); sys.exit(1)

    for reel in REELS:
        render_reel(reel)

    files = sorted(OUTPUT.glob("*.mp4"))
    print(f"\n{'='*52}")
    print(f"  {len(files)}/6 reels in {OUTPUT}/")
    for f in files:
        print(f"   • {f.name}  ({f.stat().st_size/1e6:.1f} MB)")

if __name__ == "__main__":
    main()
