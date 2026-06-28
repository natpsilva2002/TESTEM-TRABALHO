using OpenQA.Selenium;

namespace SupplyAcustic.Tests.Pages
{
    public class HomePage
    {
        private readonly IWebDriver driver;

        public HomePage(IWebDriver driver)
        {
            this.driver = driver;
        }

        public void ClicarEntrar()
        {
            IWebElement botaoEntrar = driver.FindElement(By.XPath("//button[normalize-space()='Entrar']"));
            botaoEntrar.Click();
        }

        // Botão Começar grátis
        public IWebElement BotaoComecarGratis =>
            driver.FindElement(By.XPath("//button[contains(text(),'Começar grátis')]"));

        public void ClicarComecarGratis()
        {
            BotaoComecarGratis.Click();

        }

        // Botão Ver funcionalidades
        public IWebElement BotaoVerFuncionalidades =>
            driver.FindElement(By.XPath("//button[contains(text(),'Ver funcionalidades')]"));

        public void ClicarVerFuncionalidades()
        {
            BotaoVerFuncionalidades.Click();
        }
        // Título da seção de funcionalidades
        public IWebElement TituloFuncionalidades =>
            driver.FindElement(By.XPath("//h2[contains(text(),'Análise Completa, Não Aproximada')]"));

    }
}