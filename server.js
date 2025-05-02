const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static'); // Important for Render

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow frontend access

app.post('/compress', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `compressed_${Date.now()}.mp4`);

  const ffmpeg = spawn(ffmpegPath, [
    '-i', inputPath,
    '-vcodec', 'libx264',
    '-crf', '28', // Adjust CRF to control quality vs size
    outputPath
  ]);

  // Debug logs
  ffmpeg.stdout.on('data', (data) => {
    console.log(`FFmpeg stdout: ${data}`);
  });

  ffmpeg.stderr.on('data', (data) => {
    console.error(`FFmpeg stderr: ${data}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg exited with code ${code}`);

    if (code !== 0) {
      fs.unlinkSync(inputPath); // Cleanup input file even on error
      return res.status(500).send('FFmpeg compression failed.');
    }

    res.setHeader('Content-Type', 'video/mp4');
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    fileStream.on('close', () => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  });

  ffmpeg.on('error', (err) => {
    console.error(`FFmpeg process error: ${err}`);
    fs.unlinkSync(inputPath);
    return res.status(500).send('FFmpeg process failed.');
  });
});

app.get('/', (req, res) => res.send('Video Compression API is running.'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
