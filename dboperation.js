var config = require("./dbconfig");
const sql = require("mysql");
 
async function getdata() {
  try {
    let pool = await sql.connect(config);
    console.log("sql server connected...");
  } catch (error) {
console.log(" mathus-error :" + error);
  }
}
// INFORMAÇÕES DE ESTOQUE---INTENÇÃO 1
async function getDataInfEstoque() {
    try {
      let pool = await sql.connect(config);
      let res = await pool.request().query("SELECT CODPRODUTO ,MARCA AS PRODUTO ,NOMECENTRODISTRIBUIÇÃO ,SUM(TOTALESTOQUE) AS QUANTIDADE ,SUM(VALORTOTAL)   AS VALORTOTAL	   FROM TB_ESTOQUE GROUP BY  CODPRODUTO ,MARCA   ,NOMECENTRODISTRIBUIÇÃO");
      return res.recordsets;
    } catch (error) {
      console.log("Erro intent 1:" + error);
    }
  }

 // REALIZADO X COTA POR PRODUTO E VENDEDOR----INTENÇÃO 7
async function getDataRealizadoCotaVendedorEProduto() {
    try {
      let pool = await sql.connect(config);
      let res = await pool.request().query("SELECT GRUPOMERCADO ,PRODUTO ,ANO ,MES ,SUM(VALORLIQUIDO_COTA) AS VALORLIQUIDO_COTA ,SUM(VALORLIQUIDO) AS VALORLIQUIDO FROM TB_VENDAS GROUP BY GRUPOMERCADO ,PRODUTO ,ANO ,MES");
      return res.recordsets;
    } catch (error) {
      console.log("Erro intent 7:" + error);
    }
  }

 // REALIZADO X COTA POR PRODUTO E VENDEDOR----INTENÇÃO 8
async function getDataRealizadoCotaVendedor() {
    try {
      let pool = await sql.connect(config);
      let res = await pool.request().query("SELECT GRUPOMERCADO ,VENDEDOR ,PRODUTO ,ANO ,MES ,SUM(VALORLIQUIDO_COTA) AS VALORLIQUIDO_COTA ,SUM(VALORLIQUIDO) AS VALORLIQUIDO FROM TB_VENDAS GROUP BY GRUPOMERCADO ,VENDEDOR ,PRODUTO ,ANO ,MES");
      return res.recordsets;
    } catch (error) {
      console.log("Erro intent 8:" + error);
    }
  }

 // INFORMAÇÕES DE VENDAS X COTA POR UNIDADE DE NEGÓCIO E REGIONAL YTD e Mês ----- INTENÇÃO 4 
async function getDataVendaPorRegionalEUnidade() {
    try {
      let pool = await sql.connect(config);
      let res = await pool.request().query("SELECT GRUPOMERCADO ,REGIONAL ,ANO ,MES ,SUM(VALORLIQUIDO_COTA) AS VALORLIQUIDO_COTA ,SUM(VALORLIQUIDO) AS VALORLIQUIDO FROM TB_VENDAS GROUP BY GRUPOMERCADO ,REGIONAL ,ANO ,MES");
      return res.recordsets;
    } catch (error) {
      console.log("Erro intent 4:" + error);
    }
  }

 // INFORMAÇÕES DE VENDAS X COTA POR UNIDADE DE NEGÓCIO E REGIONAL YTD e Mês ----- INTENÇÃO 5
async function getDataRealizadoPorRegional() {
    try {
      let pool = await sql.connect(config);
      let res = await pool.request().query("SELECT GRUPOMERCADO ,REGIONAL ,ANO ,MES ,SUM(VALORLIQUIDO_COTA) AS VALORLIQUIDO_COTA ,SUM(VALORLIQUIDO) AS VALORLIQUIDO FROM TB_VENDAS GROUP BY REGIONAL ,ANO ,MES");
      return res.recordsets;
    } catch (error) {
      console.log("Erro intent 5:" + error);
    }
  }
 // REALIZADO PARA O CLIENTE EM UM DETERMINADO PERÍODO ---- INTENÇÃO 12
async function getDataVendaPorRegional() {
    try {
      let pool = await sql.connect(config);
      let res = await pool.request().query("SELECT GRUPOMERCADO ,REGIONAL ,VENDEDOR ,Cliente ,ANO ,MES ,SUM(VALORLIQUIDO) AS VALORLIQUIDO FROM TB_VENDAS GROUP BY GRUPOMERCADO ,REGIONAL ,VENDEDOR ,Cliente ,ANO ,MES");
      return res.recordsets;
    } catch (error) {
      console.log("Erro intent 12:" + error);
    }
  }

module.exports = {
  getdata: getdata,
  getDataVendaPorRegional:getDataVendaPorRegional,
  getDataRealizadoPorRegional:getDataRealizadoPorRegional,
  getDataVendaPorRegionalEUnidade:getDataVendaPorRegionalEUnidade,
  getDataRealizadoCotaVendedor:getDataRealizadoCotaVendedor,
  getDataRealizadoCotaVendedorEProduto:getDataRealizadoCotaVendedorEProduto,
  getDataInfEstoque:getDataInfEstoque,
};
