using System.Text.Json;
using OakIdeas.Github.Website.Client.Menu;

namespace OakIdeas.Github.Website.Tests;

public sealed class MenuConfigurationValidatorTests
{
    [Fact]
    public void Validate_AcceptsTheVersionOneSiteMenu()
    {
        MenuConfigurationValidator.Validate(CreateConfiguration());
    }

    [Fact]
    public void Validate_RejectsDuplicateIds()
    {
        var configuration = CreateConfiguration();
        configuration.Items.Add(configuration.Items[1]);

        Assert.Throws<InvalidDataException>(() => MenuConfigurationValidator.Validate(configuration));
    }

    [Fact]
    public void Validate_RequiresAnEnabledDefaultItem()
    {
        var configuration = CreateConfiguration();
        configuration.Items[1].Enabled = false;

        Assert.Throws<InvalidDataException>(() => MenuConfigurationValidator.Validate(configuration));
    }

    [Fact]
    public void Validate_AcceptsAnHttpsExternalAction()
    {
        var configuration = CreateConfiguration();
        configuration.Items[1].Action = new MenuActionConfiguration
        {
            Type = "url",
            Url = "https://github.com/oakcool"
        };

        MenuConfigurationValidator.Validate(configuration);
    }

    [Theory]
    [InlineData("../content/identity.html")]
    [InlineData("content/%2e%2e/identity.html")]
    [InlineData("content/%252e%252e/identity.html")]
    [InlineData("content/identity%2ehtml")]
    [InlineData("/content/identity.html")]
    [InlineData("content\\identity.html")]
    [InlineData("javascript:alert(1)")]
    public void Validate_RejectsUnsafeContentPaths(string path)
    {
        var configuration = CreateConfiguration();
        configuration.Items[1].Action.ContentPath = path;

        Assert.Throws<InvalidDataException>(() => MenuConfigurationValidator.Validate(configuration));
    }

    [Theory]
    [InlineData(" \t\n")]
    public void Validate_RejectsWhitespaceOnlyRequiredText(string whitespace)
    {
        var idConfiguration = CreateConfiguration();
        idConfiguration.Items[1].Id = whitespace;
        Assert.Throws<InvalidDataException>(() => MenuConfigurationValidator.Validate(idConfiguration));

        var titleConfiguration = CreateConfiguration();
        titleConfiguration.Items[1].Title = whitespace;
        Assert.Throws<InvalidDataException>(() => MenuConfigurationValidator.Validate(titleConfiguration));

        var subtitleConfiguration = CreateConfiguration();
        subtitleConfiguration.Items[1].Subtitle = whitespace;
        Assert.Throws<InvalidDataException>(() => MenuConfigurationValidator.Validate(subtitleConfiguration));

        var altConfiguration = CreateConfiguration();
        altConfiguration.Items[1].Image.Alt = whitespace;
        Assert.Throws<InvalidDataException>(() => MenuConfigurationValidator.Validate(altConfiguration));
    }

    [Fact]
    public void Validate_AcceptsCaseInsensitiveFileExtensions()
    {
        var configuration = CreateConfiguration();
        configuration.Items[1].Action.ContentPath = "content/identity.HTML";
        configuration.Items[1].Image.Src = "Content/site.PNG";
        configuration.Items[0].Enabled = false;
        configuration.Items[0].Order = 0;

        MenuConfigurationValidator.Validate(configuration);
    }

    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("http://example.com")]
    public void Validate_RejectsUnsupportedExternalSchemes(string url)
    {
        var configuration = CreateConfiguration();
        configuration.Items[1].Action = new MenuActionConfiguration
        {
            Type = "url",
            Url = url
        };

        Assert.Throws<InvalidDataException>(() => MenuConfigurationValidator.Validate(configuration));
    }

    [Fact]
    public void Validate_RejectsAnUnsupportedAppearance()
    {
        var configuration = CreateConfiguration();
        configuration.Items[1].Appearance = "dark";

        Assert.Throws<InvalidDataException>(() => MenuConfigurationValidator.Validate(configuration));
    }

    [Fact]
    public void Validate_RejectsNonFiniteImageRatios()
    {
        var configuration = CreateConfiguration();
        configuration.Items[1].Image.ViewportHeightRatio = double.NaN;

        Assert.Throws<InvalidDataException>(() => MenuConfigurationValidator.Validate(configuration));
    }

    private static MenuConfiguration CreateConfiguration() =>
        JsonSerializer.Deserialize<MenuConfiguration>(
            File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "menu.json")),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
}
