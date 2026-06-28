using NUnit.Framework;
using SupplyAcustic.Tests.Base;
using SupplyAcustic.Tests.Pages;
using System.Threading;

namespace SupplyAcustic.Tests.Tests
{
    public class CadastroTests : BaseTest
    {
        [Test]
        public void CT05_AcessarTelaCadastro()
        {
            HomePage home = new HomePage(driver);
            LoginPage login = new LoginPage(driver);

            // Abre a tela de login
            home.ClicarEntrar();

            Thread.Sleep(2000);

            // Clica em Criar conta
            login.ClicarCriarConta();

            Thread.Sleep(2000);

            // Verifica se a tela de cadastro foi aberta
            Assert.That(driver.PageSource,
                Does.Contain("Criar conta"));
        }

        [Test]
        public void CT06_CadastroCamposObrigatoriosVazios()
        {
            HomePage home = new HomePage(driver);
            LoginPage login = new LoginPage(driver);
            CadastroPage cadastro = new CadastroPage(driver);

            // Acessa a tela de login
            home.ClicarEntrar();

            Thread.Sleep(2000);

            // Vai para a tela de cadastro
            login.ClicarCriarConta();

            Thread.Sleep(2000);

            // Não preenche nenhum campo
            cadastro.ClicarCriarConta();

            Thread.Sleep(1000);

            // Verifica que o campo Nome é obrigatório
            Assert.That(cadastro.CampoNomeEhValido(), Is.False);

            // Verifica a mensagem de validação
            Assert.That(cadastro.MensagemValidacaoNome(),
                        Does.Contain("Preencha"));
        }
    }
}