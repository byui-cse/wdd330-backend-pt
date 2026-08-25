const clone = require("clone");
const cors = require("cors");
const data = require("./database.json");
const jsonServer = require("json-server");

const isProductionEnv = process.env.NODE_ENV === "production";

const server = jsonServer.create();
const PORT = Number(process.env.PORT) || 3000;

server.use(cors());

// For mocking the POST request, POST request won't make any changes to the DB in production environment
const router = jsonServer.router(
  isProductionEnv ? clone(data) : "database.json",
  {
    _isFake: isProductionEnv
  }
);

server.use(jsonServer.bodyParser);
server.use(jsonServer.defaults());

if (isProductionEnv) {
  server.use((req, res, next) => {
    if (req.path !== "/") router.db.setState(clone(data));
    next();
  });
}

server.get("/product/:id", (req, res) => {
  const id = req.params.id;
  const product = router.db
    .get("products")
    .find((item) => item.Id === id)
    .value();

  if (product) {
    res.status(200).json({ Result: product });
  } else {
    res.status(400).json({ Result: "No Product found" });
  }
});
server.get("/products/search/:query", (req, res) => {
  const query = req.params.query;
  const filtered = router.db
    .get("products")
    .filter((product) => product.Category === query)
    .value();

  if (filtered.length > 0) {
    res.status(200).json({ Result: filtered });
  } else {
    res.status(200).json({ Result: "No products found" });
  }
});

// checkout
server.post("/checkout", (req, res) => {
  const order = req.body;
  let error = false;
  let errorMsg = {};
  // console.log(order);
  // check for required fields
  if (!order.orderDate) {
    error = true;
    errorMsg.orderDate = "No Order Date";
  }
  if (!order.fname) {
    error = true;
    errorMsg.fname = "No First Name";
  }
  if (!order.lname) {
    error = true;
    errorMsg.lname = "No Last Name";
  }
  if (!order.street || !order.city || !order.state || !order.zip) {
    error = true;
    errorMsg.address = "Missing or incomplete address";
  }
  if (!order.cardNumber) {
    error = true;
    errorMsg.cardNumber = "No card number";
  } else if (order.cardNumber !== "1234123412341234") {
    // check for valid number
    error = true;
    errorMsg.cardNumber = "Invalid Card Number";
  }
  if (!order.expiration) {
    error = true;
    errorMsg.expiration = "Missing card expiration";
  } else {
    const parts = order.expiration.split("/");
    const month = Number(parts[0]);
    const year = Number(parts[1]);

    if (parts.length === 2 && month >= 1 && month <= 12 && Number.isInteger(year)) {
      // Card is valid through the end of the expiration month.
      const expireDate = new Date(2000 + year, month, 0, 23, 59, 59, 999);
      const curDate = new Date();

      if (expireDate < curDate) {
        error = true;
        errorMsg.expiration = "Card expired";
      }
    } else {
      error = true;
      errorMsg.expiration = "Invalid expiration date";
    }
  }
  if (error) {
    res.status(400).json(errorMsg);
  } else {
    const orders = router.db.get("orders").value() || [];
    const lastOrder = orders.reduce(
      (maxOrderId, currentOrder) => Math.max(maxOrderId, Number(currentOrder.id) || 0),
      0
    );

    order.id = lastOrder + 1;
    router.db.get("orders").push(order).write();
    res.status(200).json({ orderId: order.id, message: "Order Placed" });
  }
});

server.use(router);

server.listen(PORT, () => {
  console.log(`Run WDD330 API Server on port ${PORT}`);
});

module.exports = server;
