import express from "express";
import {
  createReadStream,
  statSync,
  appendFileSync,
  unlinkSync,
  existsSync,
  readdirSync,
  readFileSync,
} from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import cors from "cors";

const _fileName = fileURLToPath(import.meta.url);
const _dirname = dirname(_fileName);

const app = express();
const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files

// Enable CORS
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/video", (req, res) => {
  const { filename } = req.query;
  const filepath = `${_dirname}/public/${filename}`;
  const stat = statSync(filepath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (!range) {
    return res.status(400).send("Requires range header");
  }

  const chunkSize = 10 ** 6;
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + chunkSize - 1, fileSize - 1);
  const contentLength = end - start + 1;

  console.log(start, end, contentLength);

  const header = {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  res.writeHead(206, header);

  const fileStream = createReadStream(filepath, { start, end });
  fileStream.pipe(res);
});

app.post("/upload", upload.single("chunk"), (req, res) => {
  const { originalname, chunkIndex, totalChunks } = req.body;
  const tempPath = req.file.path;
  const targetPath = `${_dirname}/public/${originalname}`;

  const tempFileBuffer = readFileSync(tempPath);
  appendFileSync(targetPath, tempFileBuffer);

  // Remove the temporary file
  unlinkSync(tempPath);

  // If it's the last chunk, ensure the final file is properly named/moved
  if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
    if (!existsSync(targetPath)) {
      rename(tempPath, targetPath, (err) => {
        if (err) {
          console.error("Error moving file", err);
          return res.status(500).send("Error uploading file");
        }
      });
    }
    res.status(200).send("File uploaded successfully");
  } else {
    res.status(200).send("Chunk uploaded successfully");
  }
});

app.get("/videos", (req, res) => {
  const files = readdirSync(`${_dirname}/public`).filter((file) =>
    file.endsWith(".mp4")
  );
  res.json(files);
});

app.listen(3000, () => {
  console.log("App is running on port 3000");
});
