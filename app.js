const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");

const app = express();



app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"))
app.set("view engine", "ejs");

// Create/connect to a database.
// mongoose connection url is in a separate file
mongoose.connect("", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

// Create a new Schema
const itemsSchema = {
    name: String
};

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const Item = mongoose.model("Item", itemsSchema);

// Create 3 documents
const item1 = new Item({
    name: "Take a shower"
});
const item2 = new Item({
    name: "Water plants"
});

const item3 = new Item({
    name: "Make dinner"
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res){
    Item.find({}, function(err, results){
        if (results.length === 0) {
            // Insert documents into Item table
            Item.insertMany(defaultItems, function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("Successfully inserted!");
                    
                }
                res.redirect("/");
            });
        } else {
            res.render("list", {kindOfDay: "Today", newListItems: results});
        }
    });
    
    
});


app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
            
                list.save();

                res.redirect("/" + customListName);
            } else {
                res.render("list", {kindOfDay: foundList.name, newListItems: foundList.items});
            }
        }
    })

    
})

app.post("/", function(req, res) {
    let itemName = req.body.newItem;
    let listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }

   
    
    
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate(
            {name: listName},
            {$pull: {items: {_id: checkedItemId}}},
            function(err, foundList){
                if(!err){
                    res.redirect("/" + listName);
                }
            }
        )
    }


    
});

app.get("/work", function(req, res){
    res.render("list", {kindOfDay: "Work", newListItems: workItems});
});

app.get("/about", function(req, res){
    res.render("about");
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
    console.log("Successfully connected");
});