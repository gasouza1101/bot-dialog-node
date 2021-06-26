const config = {
  user: "rdaccess",
  password: "HackaFiapMSD",
  server: "187.109.40.139",
  database: "DB_Hackaton",
  options: {
    trustedconnection: true,
    enableArithAbort: true,
    instancename: "",
  },
  port: 1433
};

module.export = config;

//  IP: 187.109.40.139
// Porta: 1433
// Usuário: rdaccess
// // Senha: HackaFiapMSD
// Informações para autenticar no SQL server do Hacka através de uma string depende da linguagem que vai ser utilizada, porém os dados que são necessários para conectar no Server são:
// IP: 187.109.40.139
// Porta: 1433
// Usuário: rdaccess
// Senha: HackaFiapMSD

// Permissão Ready-Only nos bancos:
// DB_Hackaton
// DWConfiguration
// DWDiagnostics
// DWQueue
// [5:23 PM, 6/9/2021] +55 11 99700-1256: Lembrando que caso o IP acima não funcione, temos um secundário também: 8.243.154.149