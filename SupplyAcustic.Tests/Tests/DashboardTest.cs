using NUnit.Framework;
using SupplyAcustic.Tests.Base;
using SupplyAcustic.Tests.Pages;
using System.Threading;

namespace SupplyAcustic.Tests.Tests
{
    public class DashboardTests : BaseTest
    {
        [Test]
        public void CT10_CriarPrimeiroProjeto()
        {
            HomePage home = new HomePage(driver);
            LoginPage login = new LoginPage(driver);
            DashboardPage dashboard = new DashboardPage(driver);

            // Acessa a tela de login
            home.ClicarEntrar();

            Thread.Sleep(2000);

            // Login
            login.PreencherEmail("luizalage1999@gmail.com");
            login.PreencherSenha("Luiza0510");

            login.ClicarEntrar();

            Thread.Sleep(5000);

            // Clica em Criar primeiro projeto
            dashboard.ClicarCriarPrimeiroProjeto();

            Thread.Sleep(3000);

            // Valida abertura da tela
            Assert.That(dashboard.TituloNovoProjeto.Displayed, Is.True);

            Assert.That(
                dashboard.TituloNovoProjeto.Text,
                Is.EqualTo("Novo Projeto Acústico"));
        }
    }
}