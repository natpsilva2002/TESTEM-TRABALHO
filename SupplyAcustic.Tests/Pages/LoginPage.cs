using OpenQA.Selenium;

namespace SupplyAcustic.Tests.Pages
{
    public class LoginPage
    {
        private readonly IWebDriver driver;

        public LoginPage(IWebDriver driver)
        {
            this.driver = driver;
        }

        // Campo Email
        public IWebElement CampoEmail =>
            driver.FindElement(By.Id("login-email"));

        // Campo Senha
        public IWebElement CampoSenha =>
            driver.FindElement(By.Id("login-password"));

        // Botão Entrar
        public IWebElement BotaoEntrar =>
            driver.FindElement(By.CssSelector("button[type='submit']"));

        public void ClicarEntrar()
        {
            IWebElement botao = BotaoEntrar;

            ((IJavaScriptExecutor)driver)
                .ExecuteScript("arguments[0].click();", botao);
        }

        public void PreencherEmail(string email)
        {
            CampoEmail.SendKeys(email);
        }

        public void PreencherSenha(string senha)
        {
            CampoSenha.SendKeys(senha);
        }

        // Verifica se o campo de email é válido
        public bool CampoEmailEhValido()
        {
            object? resultado = ((IJavaScriptExecutor)driver)
                .ExecuteScript("return arguments[0].checkValidity();", CampoEmail);

            return resultado is bool valido && valido;
        }

        // Mensagem de validação do navegador
        public string MensagemValidacaoEmail()
        {
            return CampoEmail.GetAttribute("validationMessage") ?? "";
        }

        // HTML da página
        public string ObterMensagemErro()
        {
            return driver.PageSource;
        }

        // Toast de erro
        public IWebElement MensagemErro =>
            driver.FindElement(By.CssSelector("div[data-title]"));

        // Aba Criar conta
        public IWebElement AbaCriarConta =>
            driver.FindElement(By.XPath("//button[contains(text(),'Criar conta')]"));

        public void ClicarCriarConta()
        {
            AbaCriarConta.Click();
        }

        public IWebElement TituloUsuario =>
    driver.FindElement(By.XPath("//h1[contains(., 'Olá')]"));
    }
}