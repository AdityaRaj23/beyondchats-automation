/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4287850865")

  // add field
  collection.fields.addAt(9, new Field({
    "convertURLs": false,
    "hidden": false,
    "id": "editor3267378810",
    "maxSize": 0,
    "name": "ai_content",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "editor"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4287850865")

  // remove field
  collection.fields.removeById("editor3267378810")

  return app.save(collection)
})
