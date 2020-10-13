const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const _ = require("lodash")
const date = require(__dirname + "/date.js");

console.clear()

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const mongoURL = "mongodb+srv://" + process.env.USERNAME + ":" + process.env.PASSWORD + "@cluster0.s3mwb.mongodb.net/todoListDB?retryWrites=true&w=majority"

mongoose.connect(mongoURL, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })

const itemSchema = new mongoose.Schema ({
	name: String
})

const listSchema = new mongoose.Schema ({
	name: String,
	items: [itemSchema]
})

const Item = mongoose.model("Item", itemSchema)
const List = mongoose.model("List", listSchema)

const default1 = new Item ({
	name: "Welcome to your TodoList!"
})

const default2 = new Item ({
	name: "Hit the '+' button to add a new item."
})

const default3 = new Item ({
	name: "<-- Hit this to delete an item."
})

const defaults = [default1, default2, default3]



app.get("/", function(req, res) {
	const day = "Today";
	Item.find({}, (err, items) => {
		if (err) {
			console.log(err);
		}
		if (items.length === 0) {
			Item.insertMany( defaults , (err) => {
				if (err) {
					console.log(err)
				} else {
					console.log("Successfully inserted items");
				}
			})
			res.redirect("/")
		} else {
			res.render("list", {listTitle: day, newListItems: items});
		}
	})

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
	const listName = req.body.list;
  const item = new Item({
		name: itemName
	})

	if (listName == "Today") {
		item.save()
		res.redirect("/")
	} else {
		List.findOne({name: listName}, (err, foundList) => {
			foundList.items.push(item)
			foundList.save()
			res.redirect("/" + listName)
		})
	}

});

app.post("/delete", (req, res) => {
	const checkedItem = req.body.checkbox;
	const listName = req.body.listName;

	if (listName == "Today") {
		Item.deleteOne({_id: checkedItem}, (err) => {
			if (err) {
				console.log(err);
			} else {
				console.log("Item was successfully deleted.");
				res.redirect("/")
			}
		})
	} else {
		List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}, (err, foundList) => {
			if (err) {
				console.log(err);
			} else {
				res.redirect("/" + listName)
			}
		})
	}
})

app.get("/:customListName", (req, res) => {
	const customListName = _.capitalize(req.params.customListName)

	List.findOne({name: customListName}, (err, foundList) => {
		if (err) {
			console.log(err);
		} else {
			if (!foundList) {
				const list = new List({
					name: customListName,
					items: defaults
				})
				list.save()
				res.redirect('/' + customListName)
			} else {
				res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
			}
		}
	})
})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
