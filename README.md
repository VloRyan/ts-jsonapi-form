[![CI Workflow](https://github.com/VloRyan/ts-jsonapi-form/actions/workflows/ci.workflow.yml/badge.svg)](https://github.com/VloRyan/ts-jsonapi-form/actions/workflows/ci.workflow.yml)

# ts-jsonapi-form

**js-jsonapi-form** is a TypeScript-based library that simplifies working with JSON:API `ResourceObject`s in React applications. It abstracts the request logic, error handling, and typing.

## ✨ Features

- Strongly typed access to JSON:API resources
- Built-in hooks for loading and managing data
- Integrated error and loading state handling
- Based on modern React, TanStack Query, and Wouter
- Ideal for building form-driven apps with API-backed resources

## 📦 Installation

TBD

## 🚀 Usage

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

## 🛠 Technologies

- **TypeScript** – for robust typing and type-safe APIs

## 📌 Project Status

This library is currently in an **early development phase** and **not ready for production** use.  
Suggestions, feedback, and contributions are very welcome!

## 📄 License

This project is licensed under the **MIT License**.
