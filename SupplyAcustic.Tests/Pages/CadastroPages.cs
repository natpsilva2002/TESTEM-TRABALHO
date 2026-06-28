using OpenQA.Selenium;

namespace SupplyAcustic.Tests.Pages
{
    public class CadastroPage
    {
        private readonly IWebDriver driver;

        public CadastroPage(IWebDriver driver)
        {
            this.driver = driver;
        }

        // Campo Nome
        public IWebElement CampoNome =>
            driver.FindElement(By.Id("signup-name"));

        // Campo Email
        public IWebElement CampoEmail =>
            driver.FindElement(By.Id("signup-email"));

        // Campo Senha
        public IWebElement CampoSenha =>
            driver.FindElement(By.Id("signup-password"));

        // Botão Criar Conta
        public IWebElement BotaoCriarConta =>
            driver.FindElement(By.CssSelector("button[type='submit']"));

        public void ClicarCriarConta()
        {
            BotaoCriarConta.Click();
        }

        // Verifica se o campo Nome é válido
        public bool CampoNomeEhValido()
        {
            object? resultado = ((IJavaScriptExecutor)driver)
                .ExecuteScript("return arguments[0].checkValidity();", CampoNome);

            return resultado is bool valido && valido;
        }

        // Mensagem de validação do campo Nome
        public string MensagemValidacaoNome()
        {
            return CampoNome.GetAttribute("validationMessage") ?? "";
        }
    }
}