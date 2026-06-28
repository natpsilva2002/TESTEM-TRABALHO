using NUnit.Framework;
using SupplyAcustic.Tests.Base;
using SupplyAcustic.Tests.Pages;
using System.Threading;
using OpenQA.Selenium.Support.UI;

namespace SupplyAcustic.Tests.Tests
{
    public class LoginTests : BaseTest
    {
        [Test]
        public void CT02_LoginCamposVazios()
        {
            HomePage home = new HomePage(driver);
            LoginPage login = new LoginPage(driver);

            // Acessa a tela de login
            home.ClicarEntrar();

            Thread.Sleep(2000);

            // Não preenche Email nem Senha
            login.ClicarEntrar();

            Thread.Sleep(1000);

            // Verifica se o campo ficou inválido
            Assert.That(login.CampoEmailEhValido(), Is.False);

            // Verifica se existe uma mensagem de validação
            Assert.That(login.MensagemValidacaoEmail(),
                        Does.Contain("Preencha"));
        }


        [Test]
       
        public void CT03_LoginEmailInvalido()
        {
            HomePage home = new HomePage(driver);
            LoginPage login = new LoginPage(driver);

            home.ClicarEntrar();

            Thread.Sleep(3000);

            login.PreencherEmail("teste");
            login.PreencherSenha("123456");

            Assert.That(login.BotaoEntrar.Displayed, Is.True);
            Assert.That(login.BotaoEntrar.Enabled, Is.True);

            login.ClicarEntrar();

            Thread.Sleep(5000);

            Assert.That(login.CampoEmailEhValido(), Is.False);
        }


        [Test]
        public void CT04_LoginSenhaInvalida()
        {
            HomePage home = new HomePage(driver);
            LoginPage login = new LoginPage(driver);

            // Acessa a tela de login
            home.ClicarEntrar();

            Thread.Sleep(2000);

            // Email válido
            login.PreencherEmail("luizalage1999@gmail.com");

            // Senha inválida
            login.PreencherSenha("123456");

            // Clica em Entrar
            login.ClicarEntrar();

            Thread.Sleep(3000);

            // Verifica a mensagem exibida
            Assert.That(login.MensagemErro.Text,
                        Is.EqualTo("Invalid login credentials"));
        }

       

        [Test]
        public void CT09_LoginValido()
        {
            HomePage home = new HomePage(driver);
            LoginPage login = new LoginPage(driver);

            // Acessa a tela de login
            home.ClicarEntrar();

            Thread.Sleep(2000);

            // Preenche o e-mail válido
            login.PreencherEmail("luizalage1999@gmail.com");

            // Preenche a senha válida
            login.PreencherSenha("Luiza0510");

            // Clica em Entrar
            login.ClicarEntrar();

            Thread.Sleep(5000);

            // Verifica se o usuário foi autenticado
            Assert.That(login.TituloUsuario.Displayed, Is.True);

            // Verifica se o texto exibido é o esperado
            Assert.That(login.TituloUsuario.Text,
                        Is.EqualTo("Olá, Luiza Lage"));
        }
    }


}