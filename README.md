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

You can use the provided hooks like `useResources` to fetch typed data from a JSON:API endpoint.  
The hook returns:

```ts
import { useResources } from "ts-jsonapi-form/hooks/UseResource.ts";

const Component = () => {
    const { doc, isLoading, error, queryKey } = useResources("/api/articles", {
        includes: ["author"],
        filter: { published: true },
    });

    if (isLoading) {
        return <p>Loading</p>;
    }
    if (error) {
        return <p>Error: {error.message}</p>;
    }

    return (
        <ul>
            {doc?.data.map((article) => (
                <li key={article.id}>{article.attributes!!.title as string}</li>
            ))}
    </ul>
);
};
```

- `doc`: a fully typed JSON:API document based on your TypeScript definitions
- `isLoading`: a boolean indicating the loading state
- `error`: any error encountered during the request
- `queryKey`: the unique cache key used by TanStack Query

This allows you to build dynamic, API-driven forms and interfaces with minimal boilerplate.

## 🛠 Technologies

- **TypeScript** – for robust typing and type-safe APIs
- **React** – for building modern UI components
- **@tanstack/react-query** – for data fetching, caching, and reactivity
- **Wouter** – a minimal routing library for React

## 📌 Project Status

This library is currently in an **early development phase** and **not ready for production** use.  
Suggestions, feedback, and contributions are very welcome!

## 📄 License

This project is licensed under the **MIT License**.
