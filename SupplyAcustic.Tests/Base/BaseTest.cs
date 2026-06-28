using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;

namespace SupplyAcustic.Tests.Base
{
    public class BaseTest
    {
        protected IWebDriver driver;s

        [SetUp]
        public void Setup()
        {
            driver = new ChromeDriver();

            driver.Manage().Window.Maximize();

            driver.Navigate().GoToUrl("http://localhost:8081/");
        }

        [TearDown]
        public void TearDown()
        {
            Thread.Sleep(10000); // Espera 10 segundos

            driver.Quit();
        }
    }
}