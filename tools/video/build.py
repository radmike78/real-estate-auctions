#!/usr/bin/env python3
"""Build a site walkthrough video.

  python3 tools/video/build.py durations <video>   read out/vo1.mp3, vo2.mp3, ... and store their lengths in video.json
  python3 tools/video/build.py render <video>      align the recording to real time, add the voiceover, write out/<video>.mp4 and .srt

<video> is a folder under tools/video (for example max-safe-bid). Needs ffmpeg: set FFMPEG, put it on PATH,
or `pip install imageio-ffmpeg`.
"""
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def ffmpeg():
    if os.environ.get('FFMPEG'):
        return os.environ['FFMPEG']
    if shutil.which('ffmpeg'):
        return 'ffmpeg'
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit('ffmpeg not found: install it, set FFMPEG, or run `pip install imageio-ffmpeg`.')


def media_seconds(f, path):
    info = subprocess.run([f, '-hide_banner', '-i', path], capture_output=True, text=True).stderr
    h, m, s = re.search(r'Duration: (\d+):(\d+):([\d.]+)', info).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def durations(vdir):
    f = ffmpeg()
    cfg_path = os.path.join(vdir, 'video.json')
    cfg = json.load(open(cfg_path))
    for i, seg in enumerate(cfg['segments'], 1):
        mp3 = os.path.join(vdir, 'out', f'vo{i}.mp3')
        if not os.path.exists(mp3):
            sys.exit(f'Missing {mp3}. Generate the voiceover for segment {i} first.')
        seg['duration'] = round(media_seconds(f, mp3), 2)
        print(f'segment {i}: {seg["duration"]}s')
    json.dump(cfg, open(cfg_path, 'w'), indent=2, ensure_ascii=False)
    open(cfg_path, 'a').write('\n')


def find_sync(f, t):
    """Times (in the raw recording) of the first green and first magenta sync frames."""
    w, h = 16, 9
    raw = subprocess.run([f, '-v', 'error', '-i', t['raw'], '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True, check=True).stdout
    info = subprocess.run([f, '-v', 'info', '-i', t['raw'], '-vf', 'showinfo', '-f', 'null', '-'], capture_output=True, text=True).stderr
    times = [float(x.split('pts_time:')[1].split()[0]) for x in info.splitlines() if 'pts_time:' in x]
    size = w * h * 3
    found = {}
    for i in range(len(raw) // size):
        px = raw[i * size:(i + 1) * size]
        r, g, b = (sum(px[c::3]) / (w * h) for c in range(3))
        key = 'g' if g > 200 and r < 60 and b < 60 else 'm' if r > 200 and b > 200 and g < 60 else None
        if key and key not in found:
            found[key] = times[i]
    if set(found) != {'g', 'm'}:
        sys.exit('Could not find both sync flashes in the recording. Re-record.')
    return found['g'], found['m']


def srt_time(x):
    ms = int(round(x * 1000))
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}'


def render(vdir, name):
    f = ffmpeg()
    out = os.path.join(vdir, 'out')
    cfg = json.load(open(os.path.join(vdir, 'video.json')))
    t = json.load(open(os.path.join(out, 'timing.json')))
    segs = cfg['segments']

    vg, vm = find_sync(f, t)
    scale = (vm - vg) / (t['tm'] - t['tg'])  # recording seconds per real second (headless capture runs a little slow)
    v0 = vg + (t['t0'] - t['tg']) * scale
    total = t['total']
    print(f'sync: start {v0:.2f}s, speed {scale:.4f}')

    ins, filt = [], []
    for i in range(len(segs)):
        ins += ['-i', os.path.join(out, f'vo{i + 1}.mp3')]
        ms = int(t['start'][i] * 1000)
        filt.append(f'[{i + 1}:a]adelay={ms}|{ms}[a{i}]')
    mix = ''.join(f'[a{i}]' for i in range(len(segs))) + (
        f'amix=inputs={len(segs)}:normalize=0,apad,atrim=0:{total:.2f},'
        'loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,aformat=channel_layouts=stereo[aout]')
    vf = (f'[0:v]trim=start={v0:.3f}:end={v0 + total * scale:.3f},setpts=(PTS-STARTPTS)/{scale:.6f},'
          'scale=1920:1080:flags=lanczos,fps=30,format=yuv420p[vout]')
    mp4 = os.path.join(out, f'{name}.mp4')
    subprocess.run([f, '-y', '-hide_banner', '-loglevel', 'error', '-i', t['raw']] + ins +
                   ['-filter_complex', ';'.join([vf] + filt + [mix]), '-map', '[vout]', '-map', '[aout]',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-c:a', 'aac', '-b:a', '192k',
                    '-movflags', '+faststart', mp4], check=True)

    # Captions file with the same timing as the burned-in captions.
    cues, n = [], 1
    for i, seg in enumerate(segs):
        chars = sum(len(c) for c in seg['captions'])
        at = t['start'][i]
        for line in seg['captions']:
            d = len(line) / chars * seg['duration']
            cues.append(f'{n}\n{srt_time(at)} --> {srt_time(at + d)}\n{line}\n')
            n += 1
            at += d
    open(os.path.join(out, f'{name}.en.srt'), 'w').write('\n'.join(cues))

    # Chapter times for the YouTube description (one per narration segment).
    print('chapters: ' + ', '.join(f'{int(s) // 60}:{int(s) % 60:02}' for s in [0] + t['start'][1:]))
    print('wrote', mp4)


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] not in ('durations', 'render'):
        sys.exit(__doc__)
    video = sys.argv[2]
    vdir = os.path.join(HERE, video)
    if not os.path.exists(os.path.join(vdir, 'video.json')):
        sys.exit(f'No such video: {vdir}')
    durations(vdir) if sys.argv[1] == 'durations' else render(vdir, video)
