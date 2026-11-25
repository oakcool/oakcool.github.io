using Bunit;
using Microsoft.AspNetCore.Components;
using OakIdeas.Github.Website.Client.Components;
using OakIdeas.Github.Website.Client.Menu;

namespace OakIdeas.Github.Website.Tests;

public sealed class WebsiteComponentTests
{
    [Fact]
    public void MenuItem_RendersAccessibleSelectedControlAndRaisesSelection()
    {
        using var context = new BunitContext();
        var item = CreateMenuItem();
        var selectionCount = 0;
        var cut = context.Render<MenuItem>(parameters => parameters
            .Add(component => component.Item, item)
            .Add(component => component.Selected, true)
            .Add(component => component.OnSelect, EventCallback.Factory.Create<MenuItemConfiguration>(this, _ => selectionCount++)));

        var button = cut.Find("button");
        Assert.Equal("page", button.GetAttribute("aria-current"));
        Assert.Equal("true", button.GetAttribute("aria-pressed"));
        Assert.Contains("mateus carvalho", button.TextContent);

        button.Click();

        Assert.Equal(1, selectionCount);
    }

    [Fact]
    public void SiteContent_HidesInitialContentAndRendersTrustedMarkup()
    {
        using var context = new BunitContext();
        var cut = context.Render<SiteContent>(parameters => parameters
            .Add(component => component.Content, "<p><strong>oak</strong>cool</p>")
            .Add(component => component.Visible, false));

        Assert.True(cut.Find("section").HasAttribute("hidden"));
        Assert.Contains("<strong>oak</strong>cool", cut.Markup);
    }

    [Fact]
    public void SiteImage_UsesConfiguredAltTextAndViewportRatio()
    {
        using var context = new BunitContext();
        var image = CreateMenuItem().Image;
        var cut = context.Render<SiteImage>(parameters => parameters.Add(component => component.Image, image));

        var renderedImage = cut.Find("img");
        Assert.Equal("Content/site.png", renderedImage.GetAttribute("src"));
        Assert.Equal("Mateus Carvalho", renderedImage.GetAttribute("alt"));
        Assert.Equal("--image-ratio:0.7", renderedImage.GetAttribute("style"));
    }

    private static MenuItemConfiguration CreateMenuItem() => new()
    {
        Id = "identity",
        Title = "mateus carvalho",
        Subtitle = "oakcool",
        Enabled = true,
        Appearance = "identity",
        Action = new MenuActionConfiguration { Type = "content", ContentPath = "content/identity.html" },
        Image = new MenuImageConfiguration
        {
            Src = "Content/site.png",
            Alt = "Mateus Carvalho",
            ViewportHeightRatio = 0.7,
            Alignment = "bottom"
        }
    };
}
