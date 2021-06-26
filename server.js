const express    = require('express');
const app        = express();
const bodyParser = require('body-parser');
const mysql      = require('mysql');
const Joi        = require('joi');
var buscaCep     = require('busca-cep');
var intentName   = "";

app.use(bodyParser.json());  //suporta corpo de mensagem/requisição em Json
app.use(bodyParser.urlencoded({
  extended: true
}));



// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
//configuração para mandar para o webhook, obedecendo a documentação do dialogflow, devem ser enviadas requisições com post pelo webhook
//para serem trratadas pela aplicação. O padrão configurado pelo nosso bodyparser é JSON, assim como o formato que o dialogflow recebe
app.post('/webhookdflow', function(request, response) {
  //seta resposta para mandar um json específico pela aplicação
  var values         = {};
  var resp           = {};
  var cadastro       = {};
  var intentName     = request.body.queryResult.intent.displayName; //pega a intent pela request
  var nome_candidato = "";
  var cpf_candidato  = "";
  var aluno_curso    = "";
  var cep_candidato  = "";
  var end_candidato  = "";
  var email_candidato= "";
  var query          = "";
  var conn           = "";
  var resp           = false;
  var result         
  
  //mapeamento de intents
  if (intentName == "welcome.intent")
  {
    values = [
      "Processo seletivo",//título do cartão
      "Bem vindo ao nosso processo seletivo!",//subtitulo do cartão
      "https://assistant.google.com/static/images/molecule/Molecule-Formation-stop.png",//imageUri
      "Temos os melhores cursos nas áreas de Humanas, Exatas e Biológicas. Inscreva-se já",//text
      "são quatro círculos coloridos sendo um azulado a esquerda, seguido de um vermelho, um pouco acima deste um verde, e abaixo do círculo vermelho, um círculo um pouco menor amarelado",//texto de acessibilidade
      "Tem interesse em participar do processo seletivo e gostaria de receber mais informações sobre ele?"//segundo text
    ];
    createMsg("card",values,response);
  }
  //mapeamento de followup intent para a intent processo.seletivo 
  else if (intentName == "processo.seletivo - yes")
  {
    //mapeamento de parameters dentro do request
    nome_candidato = request.body.queryResult.parameters['nome_candidato'];
    cpf_candidato  = request.body.queryResult.parameters['cpf_candidato'];
    aluno_curso    = request.body.queryResult.parameters['aluno-curso'];
    cep_candidato  = request.body.queryResult.parameters['cep_candidato'];
    email_candidato= request.body.queryResult.parameters['email_candidato'];
    
    cpf_candidato = cpfReplace(cpf_candidato);
    
    result = valData("1",nome_candidato,cpf_candidato,cep_candidato,aluno_curso,email_candidato);
    
    if (result.error === null)
    {
      buscaCep(cep_candidato, {sync: false, timeout: 1000}).then(endereco => {
      end_candidato = endereco.logradouro+"-"+endereco.complemento+","+endereco.bairro+"-"+endereco.localidade+"-"+endereco.uf+"--"+endereco.cep;
      
      conn = connectSql();
      
      //cria query para a base de dados, extraído do exemplo no npm do mysql
      //mais informações https://www.npmjs.com/package/mysql#establishing-connections
      query = 'insert into candidatosProcesso values ("'+nome_candidato+'","'+cpf_candidato+'","'+email_candidato+'","'+cep_candidato+'","'+end_candidato+'","'+aluno_curso+'")';
      conn.query(query,function (error, results, fields) {
          if (error) throw error
            console.log(error)
            //fecha a conexão no fim do processo
            conn.end();
          if (!error)
          {
            //manda uma resposta informando que a ação foi executada com êxito
            values = ["Pré-Inscrição executada com sucesso. \n Aguarde nosso contato, muito obrigado por manifestar seu interesse em nossa faculdade!"];
            createMsg("text",values,response);
          }
          else
          {
            //manda uma resposta informando que a ação foi executada com êxito
            values = ["Houve um erro ao processar os dados. \n Nos contate através do e-mail suporte@unidunite.com.br e reporte o ocorrido."];
            createMsg("text",values,response);
          }
        });
      }).catch(erro => {
        console.log('Erro: statusCode ${erro.statusCode} e mensagem ${erro.message}');
        values = ["Não foi possível fazer o cadastro. \n Verifique o cep informado e tente novamente."];
        createMsg("text",values,response);
      });
      
    }
    else 
    {
      values = ["Não foi possível fazer o cadastro. \n Verifique os dados informados e tente novamente."];
      createMsg("text",values,response);
    }   
  }
  else if (intentName == "consulta.processo")
  {
    //mapeamento de parameters dentro do request
    cpf_candidato  = request.body.queryResult.parameters['cpf_candidato'];
    
    cpf_candidato = cpfReplace(cpf_candidato);
    
    result = valData("2","",cpf_candidato,"","","");
    
    if (result.error === null)
    {
      conn = connectSql();
      query = 'select * from candidatosProcesso where cpfCandidato = "'+cpf_candidato+'"';
      conn.query(query,function (error, results, fields) {
        if (error) throw error
          console.log(error)
          //fecha a conexão no fim do processo
        if (!error)
        {
          if (results.length == 0)
          {
            //manda uma resposta informando que a ação foi executada sem êxito
            values = ["Cadastro não encontrado, por gentileza verifique os dados informados e tente novamente."];
            createMsg("text",values,response);
          }
          else 
          {
              cadastro = ['Nome: '     +results[0].nomeCandidato,
                           'CPF: '     +results[0].cpfCandidato,
                           'E-mail: '  +results[0].emailCandidato,
                           'CEP: '     +results[0].cepCandidato,
                           'Endereço: '+results[0].enderecoCandidato];
            
              //manda uma resposta informando que a ação foi executada com êxito
              values = ["Cadastro encontrado, os dados inseridos são: \n" +cadastro[0]+"\n"+cadastro[1]+"\n"+cadastro[2]+"\n"+cadastro[3]+"\n"+cadastro[4]+"\n. É possível alterar os dados, se necessário. \n Caso não tenha sido contatado, será contatado em breve. Espero ter ajudado 😊"];
              createMsg("text",values,response);
          }
        }
        else 
        {
            values = ["Dados não obtidos, houve um erro ao recuperar os dados.Tente novamente mais tarde"];
            createMsg("text",values,response);
        }
        conn.end();
      });
    }
    else
    {
      values = ["Não foi possível processar a solicitação. \n Verifique os dados informados e tente novamente."];
      createMsg("text",values,response);    
    }  
  }
  else if (intentName == "cancela.processo")
  {
    //mapeamento de parameters dentro do request
    cpf_candidato  = request.body.queryResult.parameters['cpf_candidato'];
    
    cpf_candidato = cpfReplace(cpf_candidato);
    
    result = valData("2","",cpf_candidato,"","","");
    
    if (result.error === null)
    {
      conn = connectSql();
      query = 'select * from candidatosProcesso where cpfCandidato = "'+cpf_candidato+'"';
      conn.query(query,function (error, results, fields) {
        if (error) throw error
          console.log(error)
          //fecha a conexão no fim do processo
        if (!error)
        {
          if (results.length == 0)
          {
            //manda uma resposta informando que a ação foi executada sem êxito
            values = ["Cadastro não encontrado, por gentileza verifique os dados informados e tente novamente."];
            createMsg("text",values,response);
          }
          else 
          {
              cadastro = ['Nome: '     +results[0].nomeCandidato,
                           'CPF: '     +results[0].cpfCandidato,
                           'E-mail: '  +results[0].emailCandidato,
                           'CEP: '     +results[0].cepCandidato,
                           'Endereço: '+results[0].enderecoCandidato];
            
              //manda uma resposta informando que a ação foi executada com êxito
              values = ["Cadastro encontrado, os dados inseridos são: \n" +cadastro[0]+"\n"+cadastro[1]+"\n"+cadastro[2]+"\n"+cadastro[3]+"\n"+cadastro[4]+"\n. Deseja realmente cancelar seu cadastro? 🤔"];
              createMsg("text",values,response);
          }
        }
        else 
        {
            values = ["Dados não obtidos, houve um erro ao recuperar os dados.Tente novamente mais tarde"];
            createMsg("text",values,response);
        }
        conn.end();
      });
    }
  }
  else if (intentName == "cancela.processo - yes")
  {
    //mapeamento de parameters dentro do request
     cpf_candidato  = request.body.queryResult.outputContexts[0].parameters['cpf_candidato'];
    
     cpf_candidato = cpfReplace(cpf_candidato);
    
     result = valData("2","",cpf_candidato,"","","");
     if (result.error === null)
     {
       conn = connectSql();
       query = 'delete from candidatosProcesso where cpfCandidato = "'+cpf_candidato+'"';
       conn.query(query,function (error, results, fields) {
          if (error) throw error
           console.log(error)
          if (!error)
          {
            //manda uma resposta informando que a ação foi executada com êxito
            values = ["Dados apagados com sucesso, caso queira executar um novo cadastro, basta solicitar 🙂"];
            createMsg("text",values,response);
          }
          else
          {
            //manda uma resposta informando que a ação foi executada sem êxito
            values = ["Não foi possível executar a deleção por um erro, verifique novamente os dados informados."];
            createMsg("text",values,response);
          }
         //fecha a conexão no fim do processo
         conn.end();
        });
     }
     else
     {
       values = ["Dados inválidos, verifique os dados informados e tente novamente."];
       createMsg("text",values,response);   
    }  
  }
  else if (intentName == "altera.processo")
  {
    //mapeamento de parameters dentro do request
    cpf_candidato  = request.body.queryResult.parameters['cpf_candidato'];
    
    cpf_candidato = cpfReplace(cpf_candidato);
    
    result = valData("2","",cpf_candidato,"","","");
    if (result.error === null)
    {
      conn = connectSql();
      query = 'select * from candidatosProcesso where cpfCandidato = "'+cpf_candidato+'"';
      conn.query(query,function (error, results, fields) {
        if (error) throw error
          console.log(error)
          //fecha a conexão no fim do processo
        if (!error)
        {
          if (results.length == 0)
          {
            //manda uma resposta informando que a ação foi executada sem êxito
            values = ["Cadastro não encontrado, por gentileza verifique os dados informados e tente novamente."];
            createMsg("text",values,response);
          }
          else 
          {
              cadastro = ['Nome: '     +results[0].nomeCandidato,
                           'CPF: '     +results[0].cpfCandidato,
                           'E-mail: '  +results[0].emailCandidato,
                           'CEP: '     +results[0].cepCandidato,
                           'Endereço: '+results[0].enderecoCandidato];
            
              //manda uma resposta informando que a ação foi executada com êxito
              values = ["Cadastro encontrado, os dados inseridos são: \n" +cadastro[0]+"\n"+cadastro[1]+"\n"+cadastro[2]+"\n"+cadastro[3]+"\n"+cadastro[4]+"\n. Deseja realmente alterar seu cadastro? 🤔"];
              createMsg("text",values,response);
          }
        }
        else 
        {
            values = ["Dados não obtidos, houve um erro ao recuperar os dados.Tente novamente mais tarde"];
            createMsg("text",values,response);
        }
        conn.end();
      });
    }
  }
  else if (intentName == "altera.processo - yes")
  {
    //mapeamento de parameters dentro do request
    nome_candidato = request.body.queryResult.parameters['nome_candidato'];
    //pega os dados do pai, a inten original altera.processo
    cpf_candidato  = request.body.queryResult.outputContexts[0].parameters['cpf_candidato'];
    aluno_curso    = request.body.queryResult.parameters['aluno_curso'];
    cep_candidato  = request.body.queryResult.parameters['cep_candidato'];
    email_candidato= request.body.queryResult.parameters['email_candidato'];
    
    console.log(aluno_curso);
    
    cpf_candidato = cpfReplace(cpf_candidato);
    
    result = valData("3",nome_candidato,"",cep_candidato,aluno_curso,email_candidato);
    
    if (result.error === null)
    {
      buscaCep(cep_candidato, {sync: false, timeout: 1000}).then(endereco => {
      end_candidato = endereco.logradouro+"-"+endereco.complemento+","+endereco.bairro+"-"+endereco.localidade+"-"+endereco.uf+"--"+endereco.cep;
      
      conn = connectSql();
      
      query = 'update candidatosProcesso set nomeCandidato = "'+nome_candidato+'" ,emailCandidato = "'+email_candidato+'" ,cursoCandidato = "'+aluno_curso+'" ,cepCandidato = "'+cep_candidato+'" ,emailCandidato = "'+email_candidato+'" ,enderecoCandidato = "'+end_candidato+'" where cpfCandidato = "'+cpf_candidato+'"';
      
      conn.query(query,function (error, results, fields) {
          if (error) throw error
            console.log(error)
            //fecha a conexão no fim do processo
            conn.end();
          if (!error)
          {
            //manda uma resposta informando que a ação foi executada com êxito
            values = ["Dados alterados com sucesso. \n Aguarde nosso contato, muito obrigado por manifestar seu interesse em nossa faculdade!"];
            createMsg("text",values,response);
          }
          else
          {
             //manda uma resposta informando que a ação foi executada com êxito
            values = ["Houve um erro ao processar os dados. \n Nos contate através do e-mail suporte@unidunite.com.br e reporte o ocorrido."];
            createMsg("text",values,response);
          }
        });
      }).catch(erro => {
        console.log('Erro: statusCode ${erro.statusCode} e mensagem ${erro.message}');
        values = ["Não foi possível fazer o cadastro. \n Verifique o cep informado e tente novamente."];
        createMsg("text",values,response);
      }); 
    }
    else 
    {
      values = ["Não foi possível alterar os dados. \n Verifique os dados informados e tente novamente."];
      createMsg("text",values,response);
    }  
  }
  else if (intentName == "faq.cantina")
  {
    values = ["Cantina :)"];
    createMsg("text",values,response);
  }
});

function createMsg(type,values,response)
{
  if (type == "text")
  {
    response.json({
    "fulfillmentText":values[0]
  });
  }
  else if(type == "card")
  {
    response.json({
      "fulfillmentMessages":[
        {
        "card":{
          "title":values[0],
          "subtitle": values[1],
          "imageUri":values[2]
          }
        },
        {
          "text":{
            "text":[
              values[3]
            ]
          }
        },
        {
          "image":{
            "imageUri":values[2],
            "accessibilityText": values[4]
          }
        },
        {
          "text":{
            "text":[
              values[5]
            ]
          }
        },
      ],
    });
  }
}

function valData(mode,nome_candidato,cpf_candidato,cep_candidato,aluno_curso,email_candidato)
{
  var validador = "";
  var resultado = "";
   
  if (mode == "1")
  {
    //define schema para validação
    validador = Joi.object().keys({
      nome:  Joi.string().min(8).max(30),
      cpf:   Joi.string().regex(/[0-9]/),
      cep:   Joi.string().regex(/[0-9]{5}-[\d]{3}/),
      curso: Joi.string().min(2).max(30),
      email: Joi.string().email()
    });
    //define schema para validação
    resultado = Joi.validate({
      nome:  nome_candidato,
      cpf:   cpf_candidato,
      cep:   cep_candidato,
      curso: aluno_curso,
      email: email_candidato
    },validador);
  }
  else if (mode == "2")
  {
    //define schema para validação
    validador = Joi.object().keys({
      cpf:   Joi.string().regex(/[0-9]/)
      });
    
    resultado = Joi.validate({
      cpf:   cpf_candidato
    },validador);
  }
  else 
  {
    //define schema para validação
    validador = Joi.object().keys({
      nome:  Joi.string().min(8).max(30),
      cep:   Joi.string().regex(/[0-9]{5}-[\d]{3}/),
      curso: Joi.string().min(2).max(30),
      email: Joi.string().email()
    });
    //define schema para validação
    resultado = Joi.validate({
      nome:  nome_candidato,
      cep:   cep_candidato,
      curso: aluno_curso,
      email: email_candidato
    },validador);
  }
  return resultado
}

function cpfReplace(cpf)
{
  cpf = cpf.replace(".", "");
  cpf = cpf.replace(".", "");
  cpf = cpf.replace("-", "");
  return cpf 
}

function connectSql()
{
  //conectando na base de dados
  var connection = mysql.createConnection({
    host     : process.env.MYSQL_HOST,
    user     : process.env.MYSQL_USER,
    password : process.env.MYSQL_PASS,
    database : process.env.MYSQL_DB
  });
  
  connection.connect(function(err) {
      if (err) {
        console.error('Erro ao conectar a base de dados: ' + err.stack);
        return;
      }
 
      console.log('Conectado com o Id:  ' + connection.threadId);
      });
  return connection
}

const listener = app.listen(process.env.PORT, function() {
    //console.log('App rodando na porta: ' + listener.address().port);
});