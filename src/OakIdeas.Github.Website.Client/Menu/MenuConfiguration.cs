namespace OakIdeas.Github.Website.Client.Menu;

public sealed class MenuConfiguration
{
    public int SchemaVersion { get; set; }
    public string DefaultItemId { get; set; } = string.Empty;
    public List<MenuItemConfiguration> Items { get; set; } = [];
}

public sealed class MenuItemConfiguration
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool Enabled { get; set; }
    public string Appearance { get; set; } = string.Empty;
    public MenuActionConfiguration Action { get; set; } = new();
    public MenuImageConfiguration Image { get; set; } = new();
}

public sealed class MenuActionConfiguration
{
    public string Type { get; set; } = string.Empty;
    public string? ContentPath { get; set; }
    public string? Url { get; set; }
}

public sealed class MenuImageConfiguration
{
    public string Src { get; set; } = string.Empty;
    public string Alt { get; set; } = string.Empty;
    public double ViewportHeightRatio { get; set; }
    public string Alignment { get; set; } = string.Empty;
}
