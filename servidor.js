const path = require("path");
const clone = require("clone");
const cors = require("cors");
const data = require("./banco-de-dados.json");
const jsonServer = require("json-server");

const ehProducao = process.env.NODE_ENV === "production";

const server = jsonServer.create();
const PORT = Number(process.env.PORT) || 3000;

server.use(cors());

// Para simular a requisição POST, o POST não fará nenhuma alteração no BD em ambiente de produção
const router = jsonServer.router(
  ehProducao ? clone(data) : "banco-de-dados.json",
  {
    _isFake: ehProducao
  }
);

server.use(jsonServer.bodyParser);
server.use(jsonServer.defaults({ static: path.join(__dirname, "publico") }));

if (ehProducao) {
  server.use((req, res, next) => {
    if (req.path !== "/") router.db.setState(clone(data));
    next();
  });
}

// ----------------------------------------------------------------------
// Rotas em português (curso WDD 330 em português)
// ----------------------------------------------------------------------
server.get("/produto/:id", (req, res) => {
  const id = req.params.id;
  const produto = router.db
    .get("produtos")
    .find((item) => item.Id === id)
    .value();

  if (produto) {
    res.status(200).json({ Result: produto });
  } else {
    res.status(400).json({ Result: "Produto não encontrado" });
  }
});
server.get("/produtos/busca/:categoria", (req, res) => {
  const categoria = req.params.categoria;
  const filtrados = router.db
    .get("produtos")
    .filter((produto) => produto.Categoria === categoria)
    .value();

  if (filtrados.length > 0) {
    res.status(200).json({ Result: filtrados });
  } else {
    res.status(200).json({ Result: "Nenhum produto encontrado" });
  }
});

// finalizar_compra (checkout)
server.post("/finalizar-compra", (req, res) => {
  const pedido = req.body;
  let erro = false;
  let msgErro = {};
  // console.log(pedido);
  // verifica os campos obrigatórios
  if (!pedido.dataPedido) {
    erro = true;
    msgErro.dataPedido = "Data do pedido não informada";
  }
  if (!pedido.pnome) {
    erro = true;
    msgErro.pnome = "Nome não informado";
  }
  if (!pedido.snome) {
    erro = true;
    msgErro.snome = "Sobrenome não informado";
  }
  if (!pedido.endereco || !pedido.cidade || !pedido.estado || !pedido.cep) {
    erro = true;
    msgErro.endereco = "Endereço ausente ou incompleto";
  }
  if (!pedido.numeroCartao) {
    erro = true;
    msgErro.numeroCartao = "Número do cartão não informado";
  } else if (pedido.numeroCartao !== "1234123412341234") {
    // verifica se o número é válido
    erro = true;
    msgErro.numeroCartao = "Número do cartão inválido";
  }
  if (!pedido.validade) {
    erro = true;
    msgErro.validade = "Validade do cartão não informada";
  } else {
    const partes = pedido.validade.split("/");
    const mes = Number(partes[0]);
    const ano = Number(partes[1]);

    if (partes.length === 2 && mes >= 1 && mes <= 12 && Number.isInteger(ano)) {
      // O cartão é válido até o fim do mês de validade.
      const dataValidade = new Date(2000 + ano, mes, 0, 23, 59, 59, 999);
      const dataAtual = new Date();

      if (dataValidade < dataAtual) {
        erro = true;
        msgErro.validade = "Cartão expirado";
      }
    } else {
      erro = true;
      msgErro.validade = "Data de validade inválida";
    }
  }
  if (erro) {
    res.status(400).json(msgErro);
  } else {
    const pedidos = router.db.get("pedidos").value() || [];
    const ultimoPedido = pedidos.reduce(
      (maiorId, pedidoAtual) => Math.max(maiorId, Number(pedidoAtual.id) || 0),
      0
    );

    pedido.id = ultimoPedido + 1;
    router.db.get("pedidos").push(pedido).write();
    res.status(200).json({ idPedido: pedido.id, mensagem: "Pedido realizado" });
  }
});

// ----------------------------------------------------------------------
// English routes (WDD 330 English-track course) — unmodified from the
// original wdd330-backend, kept side by side with the Portuguese routes
// above. Neither set of routes/collections overlaps with the other.
// ----------------------------------------------------------------------
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
  console.log(`Servidor da API WDD330 rodando na porta ${PORT}`);
});

module.exports = server;
