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
        configuration.Items.Add(CreateItem("identity"));

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

    private static MenuConfiguration CreateConfiguration() => new()
    {
        SchemaVersion = 1,
        DefaultItemId = "identity",
        Items = [CreateItem("projects"), CreateItem("identity")]
    };

    private static MenuItemConfiguration CreateItem(string id) => new()
    {
        Id = id,
        Title = id,
        Subtitle = "oakideas",
        Enabled = true,
        Appearance = id == "identity" ? "identity" : "standard",
        Action = new MenuActionConfiguration
        {
            Type = "content",
            ContentPath = $"content/{id}.html"
        },
        Image = new MenuImageConfiguration
        {
            Src = "Content/site.png",
            Alt = "site",
            ViewportHeightRatio = 0.7,
            Alignment = "bottom"
        }
    };
}
