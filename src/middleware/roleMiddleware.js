export function permitirTipos(...tiposPermitidos) {

  return (req, res, next) => {

    // O middleware JWT precisa executar antes
    if (!req.usuario) {
      return res.status(401).json({
        mensagem: "Usuário não autenticado.",
      });
    }


    // Verifica o tipo do usuário
    if (!tiposPermitidos.includes(req.usuario.tipo)) {

      return res.status(403).json({
        mensagem: "Você não possui permissão para acessar este recurso.",
      });

    }


    next();
  };
}