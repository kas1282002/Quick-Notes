const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Home Page
app.get("/", function (req, res) {
  fs.readdir(`./files`, function (err, files) {
    if (err) files = [];
    res.render("index", { files: files });
  });
});

// View a File
app.get("/file/:filename", function (req, res) {
  fs.readFile(`./files/${req.params.filename}`, "utf-8", function (err, filedata) {
    if (err) return res.send("File not found!");
    res.render("show", { filename: req.params.filename, filedata: filedata });
  });
});

// Edit Filename
app.get("/edit/:filename", function (req, res) {
  res.render("edit", { filename: req.params.filename });
});

app.post("/edit", function (req, res) {
  fs.rename(`./files/${req.body.previous}`, `./files/${req.body.new}`, function (err) {
    res.redirect("/");
  });
});

// Create New File
app.post("/create", function (req, res) {
  fs.writeFile(`./files/${req.body.title.split(" ").join("")}.txt`, req.body.details, function (err) {
    res.redirect("/");
  });
});

// 🗑️ DELETE File Route
app.post("/delete/:filename", function (req, res) {
  fs.unlink(`./files/${req.params.filename}`, function (err) {
    if (err) return res.send("Error deleting file!");
    res.redirect("/");
  });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
