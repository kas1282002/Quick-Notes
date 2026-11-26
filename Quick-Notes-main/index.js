const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const filesDirectory = path.join(__dirname, "files");

// Git does not retain empty folders. Create the notes directory when the
// service starts so a freshly deployed app can save its first note.
fs.mkdirSync(filesDirectory, { recursive: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function toNoteFilename(value) {
  const title = String(value || "")
    .trim()
    .replace(/\.txt$/i, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-");

  return title ? `${title}.txt` : null;
}

function getNotePath(filename) {
  if (!filename || path.basename(filename) !== filename || !filename.endsWith(".txt")) {
    return null;
  }

  return path.join(filesDirectory, filename);
}

function redirectWithError(res, message) {
  return res.redirect(`/?error=${encodeURIComponent(message)}`);
}

app.get("/", function (req, res) {
  fs.readdir(filesDirectory, { withFileTypes: true }, function (err, entries) {
    const files = err ? [] : entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
      .map((entry) => entry.name)
      .sort((first, second) => second.localeCompare(first));
    res.render("index", { files, error: req.query.error || "" });
  });
});

app.get("/file/:filename", function (req, res) {
  const notePath = getNotePath(req.params.filename);
  if (!notePath) return res.status(400).send("Invalid note name.");

  fs.readFile(notePath, "utf-8", function (err, filedata) {
    if (err) return res.status(404).send("Note not found.");
    res.render("show", { filename: req.params.filename, filedata });
  });
});

app.get("/edit/:filename", function (req, res) {
  if (!getNotePath(req.params.filename)) return res.status(400).send("Invalid note name.");
  res.render("edit", { filename: req.params.filename });
});

app.post("/edit", function (req, res) {
  const previousPath = getNotePath(req.body.previous);
  const newFilename = toNoteFilename(req.body.new);
  const newPath = newFilename && getNotePath(newFilename);
  if (!previousPath || !newPath) return redirectWithError(res, "Please enter a valid note title.");

  fs.rename(previousPath, newPath, function (err) {
    if (err) return redirectWithError(res, "Unable to rename the note. Please try again.");
    res.redirect("/");
  });
});

// Create New File
app.post("/create", function (req, res) {
  const details = req.body.details || "";
  const filename = toNoteFilename(req.body.title);
  const notePath = filename && getNotePath(filename);

  if (!notePath || !details.trim()) {
    return redirectWithError(res, "A title and note are required.");
  }

  fs.writeFile(notePath, details, { encoding: "utf-8", flag: "wx" }, function (err) {
    if (err) {
      console.error("Unable to save note:", err);
      const message = err.code === "EEXIST"
        ? "A note with this title already exists. Choose a different title."
        : "Unable to save the note. Please try again.";
      return redirectWithError(res, message);
    }
    res.redirect("/");
  });
});

// 🗑️ DELETE File Route
app.post("/delete/:filename", function (req, res) {
  const notePath = getNotePath(req.params.filename);
  if (!notePath) return redirectWithError(res, "Invalid note name.");

  fs.unlink(notePath, function (err) {
    if (err) {
      console.error("Unable to delete note:", err);
      return redirectWithError(res, "Unable to delete the note. Please try again.");
    }
    res.redirect("/");
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
