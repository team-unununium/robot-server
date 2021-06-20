const m3u8Template = '#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXT-X-VERSION:4\n'
const bufferCount = process.env.BUFFER_COUNT | 10

var stream = {
    mediaSequence: 0,
    bufferDuration: 0.4,
    previousVideos: [],
    m3u8String: m3u8Template,
    addVideo: (data) => {
        stream.previousVideos.push(data)
        stream.mediaSequence += 1
        stream.m3u8String = m3u8Template + '#EXT-X-MEDIA-SEQUENCE:' + stream.mediaSequence + '\n'
        for (var i = 0; i < bufferCount; i++) {
            stream.m3u8String += '#EXTINF:' + stream.bufferDuration + '\n' + 'video' + (stream.mediaSequence + i) + '.h264\n'
        }
    },
    routerMiddleware: (req, res, next) => {
        if (req.method === 'GET') {
            for (var i = 0; i < bufferCount; i++) {
                if (req.originalUrl === '/video' + (stream.mediaSequence + i) + '.h264') {
                    return res.send(Buffer.from(stream.previousVideos[i]))
                }
            }
            next()
        } else {
            next()
        }
    },
    reset: () => {
        stream.mediaSequence = 0,
        stream.previousVideos = [],
        stream.m3u8String = m3u8Template
    }
}

module.exports = stream