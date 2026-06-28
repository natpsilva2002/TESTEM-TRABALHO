using OpenQA.Selenium;

namespace SupplyAcustic.Tests.Pages
{
    public class DashboardPage
    {
        private readonly IWebDriver driver;

        public DashboardPage(IWebDriver driver)
        {
            this.driver = driver;
        }

        // Botão Criar primeiro projeto
        public IWebElement BotaoCriarPrimeiroProjeto =>
            driver.FindElement(By.XPath("//button[contains(.,'Criar primeiro projeto')]"));

        // Título da tela Novo Projeto
        public IWebElement TituloNovoProjeto =>
            driver.FindElement(By.XPath("//h2[contains(.,'Novo Projeto Acústico')]"));

        public void ClicarCriarPrimeiroProjeto()
        {
            BotaoCriarPrimeiroProjeto.Click();
        }
    }
}