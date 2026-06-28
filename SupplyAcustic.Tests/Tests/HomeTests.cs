using NUnit.Framework;
using SupplyAcustic.Tests.Base;
using SupplyAcustic.Tests.Pages;
using System.Threading;

namespace SupplyAcustic.Tests.Tests
{
    public class HomeTests : BaseTest
    {
        [Test]
        public void CT01_VerificarPaginaInicial()
        {
            // Verifica se o título da página contém "Supply"
            Assert.That(driver.Title, Does.Contain("Supply"));
        }

        [Test]
      
        public void CT02_ClicarBotaoEntrar()
        {
            HomePage home = new HomePage(driver);

            // Espera 5 segundos antes do clique
            Thread.Sleep(5000);

            home.ClicarEntrar();

            // Espera 5 segundos após o clique
            Thread.Sleep(5000);

            Assert.That(driver.PageSource, Does.Contain("Bem-vindo de volta"));
        }

        [Test]
        public void CT07_VerificarBotaoComecarGratis()
        {
            HomePage home = new HomePage(driver);
            CadastroPage cadastro = new CadastroPage(driver);

            // Página inicial já é aberta pelo BaseTest

            Thread.Sleep(2000);

            // Clica no botão Começar grátis
            home.ClicarComecarGratis();

            Thread.Sleep(2000);

           
        }

        [Test]
        public void CT08_VerificarBotaoVerFuncionalidades()
        {
            HomePage home = new HomePage(driver);

            // Aguarda a página carregar
            Thread.Sleep(2000);

            // Clica em "Ver funcionalidades"
            home.ClicarVerFuncionalidades();

            // Aguarda o scroll terminar
            Thread.Sleep(3000);

            // Verifica se a seção de funcionalidades está visível
            Assert.That(home.TituloFuncionalidades.Displayed, Is.True);
        }
    }
}