[![CI Workflow](https://github.com/VloRyan/ts-jsonapi-form/actions/workflows/ci.workflow.yml/badge.svg)](https://github.com/VloRyan/ts-jsonapi-form/actions/workflows/ci.workflow.yml)

# ts-jsonapi-form

**js-jsonapi-form** is a TypeScript-based library that simplifies working with JSON:API `ResourceObject`s in React
applications. It abstracts the request logic, error handling, and typing.

## ✨ Features

- Strongly typed access to JSON:API resources
- Built-in hooks for loading and managing data
- Integrated error and loading state handling
- Based on modern React, TanStack Query, and Wouter
- Ideal for building form-driven apps with API-backed resources

## 📦 Installation

```
npm install https://github.com/VloRyan/ts-jsonapi-form
```

## 🚀 Usage

### Fetching

For fetching resources according to this request

```http request
GET /articles/1?filter[name]=ts-jsonapi-form&include=comments HTTP/1.1
Accept: application/vnd.api+json
```

you can do the following

```ts
import { fetchResource } from "ts-jsonapi-form/jsonapi/JsonApi.ts";

fetchResource("http://example.com/articles", {
  filter: { name: "ts-jsonapi-form" },
  includes: ["comments"],
})
  .then((doc) => {
    console.log(doc);
  })
  .catch((err) => err.message);
```

- `doc`: a fully typed [JSON:API document](https://jsonapi.org/format/#document-structure)

This allows you to build dynamic, API-driven forms and interfaces with minimal boilerplate.

### Handle the document

For handling the document structure create a DocumentForm to have a simple access to the structure (attributes,
relationships, includes) of the document.

Provided the following document (source: [jsonapi.org](https://jsonapi.org/))

```json
{
  "data": [
    {
      "type": "articles",
      "id": "1",
      "attributes": {
        "title": "JSON:API paints my bikeshed!"
      },
      "relationships": {
        "author": {
          "links": {
            "self": "http://example.com/articles/1/relationships/author",
            "related": "http://example.com/articles/1/author"
          },
          "data": {
            "type": "people",
            "id": "9"
          }
        },
        "comments": {
          "data": [
            {
              "type": "comments",
              "id": "5"
            },
            {
              "type": "comments",
              "id": "12"
            }
          ]
        }
      }
    }
  ],
  "included": [
    {
      "type": "people",
      "id": "9",
      "attributes": {
        "firstName": "Dan",
        "lastName": "Gebhardt",
        "twitter": "dgeb"
      }
    },
    {
      "type": "comments",
      "id": "5",
      "attributes": {
        "body": "First!"
      }
    },
    {
      "type": "comments",
      "id": "12",
      "attributes": {
        "body": "I like XML better"
      }
    }
  ]
}
```

you can access the data in this way:

```ts
import { SingleResourceDoc } from "@vloryan/ts-jsonapi-form/jsonapi";
import { DocumentForm } from "@vloryan/ts-jsonapi-form/form";

function printDocument(doc: SingleResourceDoc) {
  const form = new DocumentForm(doc);

  console.log("ID: " + form.getValue("id"))
  console.log("Title: " + form.getValue("title"))

  const author = form.getValue("author") // direct get the object from document.included...
  console.log("Author name: " + author.firstname + " " + form.getValue("author.lastName")); //... attributes by path

  console.log("Second comment: " + form.getValue("comments[1].body")); // arrays the also supported
  form.setValue("comments[1].body", "Super duppa comment") // setting values works the same way
}
```

For more examples see [form/DocumentForm.test.ts](./form/DocumentForm.test.ts)

### Use it in HTML(React):

```html

<form {...form.setup()}>
  <input type="text" name="title" defaultValue={form.getValue("title")} onChange={form.handleChange}>
</form>
```

In practice better wrap input creation like in [boot-api-ts](https://github.com/VloRyan/boot-api-ts)

## 🛠 Technologies

- **TypeScript** – for robust typing and type-safe APIs

## 📌 Project Status

This library is currently in an **early development phase** and **not ready for production** use.  
Suggestions, feedback, and contributions are very welcome!

## 📄 License

This project is licensed under the **MIT License**.
