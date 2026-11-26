const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const filesDirectory = path.join(__dirname, "files");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Home Page
app.get("/", function (req, res) {
  fs.readdir(filesDirectory, function (err, files) {
    if (err) files = [];
    res.render("index", { files: files });
  });
});

// View a File
app.get("/file/:filename", function (req, res) {
  fs.readFile(path.join(filesDirectory, req.params.filename), "utf-8", function (err, filedata) {
    if (err) return res.send("File not found!");
    res.render("show", { filename: req.params.filename, filedata: filedata });
  });
});

// Edit Filename
app.get("/edit/:filename", function (req, res) {
  res.render("edit", { filename: req.params.filename });
});

app.post("/edit", function (req, res) {
  fs.rename(path.join(filesDirectory, req.body.previous), path.join(filesDirectory, req.body.new), function (err) {
    res.redirect("/");
  });
});

// Create New File
app.post("/create", function (req, res) {
  fs.writeFile(path.join(filesDirectory, `${req.body.title.split(" ").join("")}.txt`), req.body.details, function (err) {
    res.redirect("/");
  });
});

// 🗑️ DELETE File Route
app.post("/delete/:filename", function (req, res) {
  fs.unlink(path.join(filesDirectory, req.params.filename), function (err) {
    if (err) return res.send("Error deleting file!");
    res.redirect("/");
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
