<<<<<<< HEAD
# scope
Feature Request Data
=======
# Scope Feature Requests - 239 Entries

https://observablehq.com/@reticle/scope-feature-requests@36

View this notebook in your browser by running a web server in this folder. For
example:

~~~sh
npx http-server
~~~

Or, use the [Observable Runtime](https://github.com/observablehq/runtime) to
import this module directly into your application. To npm install:

~~~sh
npm install @observablehq/runtime@5
npm install https://api.observablehq.com/d/59b9238142385d25@36.tgz?v=3
~~~

Then, import your notebook and the runtime as:

~~~js
import {Runtime, Inspector} from "@observablehq/runtime";
import define from "@reticle/scope-feature-requests";
~~~

To log the value of the cell named “foo”:

~~~js
const runtime = new Runtime();
const main = runtime.module(define);
main.value("foo").then(value => console.log(value));
~~~
>>>>>>> f089e29 (Initial Data Set)
