/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4287850865")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "updated",
      "original",
      "enriched"
    ]
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "convertURLs": false,
    "hidden": false,
    "id": "editor3267378810",
    "maxSize": 0,
    "name": "generated_content",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "editor"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4287850865")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "updated",
      "original"
    ]
  }))

  // update field
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
})
