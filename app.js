//jshint esversion:6

require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const uri = process.env.ATLAS_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = mongoose.Schema({
  name: String
});

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your To-do List"
});

const item2 = new Item({
  name: "Click on + to add new items."
});

const item3 = new Item({
  name: "<-- click here to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("list", listSchema);

app.get("/", function (req, res) {

  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        console.log("Successfully saved default items to DB");
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });

});

app.get("/:customList", function (req, res) {
  const customListName = _.capitalize(req.params.customList);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {

      if (!foundList) {
        //create a new list

        const newList = new List({
          name: customListName,
          items: defaultItems
        });

        newList.save(function () {
          res.redirect("/" + customListName);
        });

      } else {
        //display an existing list

        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save(function () {
      res.redirect("/");
    });
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(newItem);
      foundList.save(function () {
        res.redirect("/" + listName);
      });
    });
  }

});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const list_Name = req.body.listName;

  if(list_Name === "Today"){
    Item.findByIdAndRemove(checkedItemId, { useFindAndModify: false }, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    }); 
  } else {
    List.findOneAndUpdate({name: list_Name}, {$pull: {items: {_id: checkedItemId}}}, { useFindAndModify: false }, function(err, foundList){
      if(err){
        console.log(err);
      } else{
        res.redirect("/" + list_Name);
      }
    });
  }
});


app.listen(3000, function () {
  console.log("Server started on port 3000");
});
