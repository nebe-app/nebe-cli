# Nebe CLI

[![npm](https://img.shields.io/npm/v/nebe-cli.svg)](https://www.npmjs.com/package/nebe-cli)

Install globally using npm or yarn

```bash
npm install nebe-cli --global
```
```bash
yarn global add nebe-cli
```

Documentation and installation guide: on https://www.nebe.app/docs

Get list of available commands: `nebe help`

Ffmpeg helpers:

```
Install ffmpeg
brew install ffmpeg

Get info
ffprobe video.mp4

Get length of video
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video.mp4

Extract part of video
ffmpeg -ss 53.8 -i video.mp4 -t 21.122667 -c copy output.mp4

Extract audio from video
ffmpeg -i video.mp4 -vn audio.mp3
ffmpeg -i video.mp4 -vn -acodec copy audio.mp3

Extract video without audio
ffmpeg -i video.mp4 -c copy -an video-noaudio.mp4

Volume up audio
ffmpeg -y -i jingle.wav -filter_complex "[0:0]volume=2.0[out]" -map "[out]" jingle20.wav
```
