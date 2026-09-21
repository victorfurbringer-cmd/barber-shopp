import jwt from "jsonwebtoken";

export function verificarToken(req, res, next) {

  try {

    // Obtém o header Authorization
    const authorization = req.headers.authorization;


    // Verifica se o header existe
    if (!authorization) {
      return res.status(401).json({
        mensagem: "Token de autenticação não informado.",
      });
    }


    // Esperamos:
    //
    // Authorization: Bearer TOKEN

    const partes = authorization.split(" ");


    if (partes.length !== 2 || partes[0] !== "Bearer") {

      return res.status(401).json({
        mensagem: "Formato do token inválido.",
      });

    }


    const token = partes[1];


    // Verifica o JWT
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );


    // Coloca os dados do usuário dentro da requisição
    req.usuario = payload;


    // Continua para a rota
    next();

  } catch (error) {

    console.error(error.message);

    return res.status(401).json({
      mensagem: "Token inválido ou expirado.",
    });

  }

}