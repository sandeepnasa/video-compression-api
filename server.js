const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow frontend access

app.post('/compress', upload.single('video'), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `compressed_${Date.now()}.mp4`);

  // FFmpeg command to compress video
  const ffmpeg = spawn(require('ffmpeg-static'), [
    '-i', inputPath,
    '-vcodec', 'libx264',
    '-crf', '28', // Higher = more compression, lower = better quality
    outputPath
  ]);

  ffmpeg.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).send('FFmpeg compression failed.');
    }

    const fileStream = fs.createReadStream(outputPath);
    res.setHeader('Content-Type', 'video/mp4');
    fileStream.pipe(res);

    fileStream.on('close', () => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  });

  ffmpeg.on('error', (err) => {
    res.status(500).send('FFmpeg process error.');
  });
});

app.get('/', (req, res) => res.send('Video Compression API is running.'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
