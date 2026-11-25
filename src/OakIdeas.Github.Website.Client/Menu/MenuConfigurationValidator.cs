using System.Text.RegularExpressions;

namespace OakIdeas.Github.Website.Client.Menu;

public static partial class MenuConfigurationValidator
{
    private static readonly HashSet<string> SupportedAppearances = ["standard", "identity"];

    public static void Validate(MenuConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (configuration.SchemaVersion != 1)
        {
            throw new InvalidDataException("Only menu schema version 1 is supported.");
        }

        if (configuration.Items is null ||
            configuration.Items.Count == 0 ||
            string.IsNullOrWhiteSpace(configuration.DefaultItemId))
        {
            throw new InvalidDataException("The menu must contain items and name its default item.");
        }

        var ids = new HashSet<string>(StringComparer.Ordinal);
        foreach (var item in configuration.Items)
        {
            if (item is null || item.Action is null || item.Image is null)
            {
                throw new InvalidDataException("Menu items must include an action and image configuration.");
            }

            if (string.IsNullOrWhiteSpace(item.Id) || !ids.Add(item.Id))
            {
                throw new InvalidDataException("Menu item ids must be non-empty and unique.");
            }

            if (string.IsNullOrWhiteSpace(item.Title) || string.IsNullOrWhiteSpace(item.Subtitle))
            {
                throw new InvalidDataException($"Menu item '{item.Id}' must have a title and subtitle.");
            }

            if (!SupportedAppearances.Contains(item.Appearance))
            {
                throw new InvalidDataException($"Menu item '{item.Id}' has an unsupported appearance.");
            }

            ValidateAction(item);
            ValidateImage(item);
        }

        if (!configuration.Items.Any(item => item.Id == configuration.DefaultItemId && item.Enabled))
        {
            throw new InvalidDataException("The default menu item must exist and be enabled.");
        }
    }

    public static bool IsSafeRelativePath(string? path)
    {
        if (string.IsNullOrWhiteSpace(path) ||
            path.StartsWith('/') ||
            path.Contains('\\') ||
            path.Contains(':') ||
            path.Contains('%'))
        {
            return false;
        }

        return path.Split('/').All(segment =>
            segment.Length > 0 &&
            segment is not "." and not ".." &&
            SafePathSegmentRegex().IsMatch(segment));
    }

    private static void ValidateAction(MenuItemConfiguration item)
    {
        switch (item.Action.Type)
        {
            case "content":
                if (!IsSafeRelativePath(item.Action.ContentPath) ||
                    !item.Action.ContentPath!.EndsWith(".html", StringComparison.OrdinalIgnoreCase) ||
                    item.Action.Url is not null)
                {
                    throw new InvalidDataException($"Menu item '{item.Id}' has an invalid content action.");
                }

                break;
            case "url":
                if (item.Action.ContentPath is not null ||
                    !Uri.TryCreate(item.Action.Url, UriKind.Absolute, out var uri) ||
                    uri.Scheme != Uri.UriSchemeHttps ||
                    string.IsNullOrEmpty(uri.Host) ||
                    !string.IsNullOrEmpty(uri.UserInfo))
                {
                    throw new InvalidDataException($"Menu item '{item.Id}' has an invalid external URL.");
                }

                break;
            default:
                throw new InvalidDataException($"Menu item '{item.Id}' has an unsupported action.");
        }
    }

    private static void ValidateImage(MenuItemConfiguration item)
    {
        if (!IsSafeRelativePath(item.Image.Src) ||
            !item.Image.Src.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
            string.IsNullOrWhiteSpace(item.Image.Alt) ||
            !double.IsFinite(item.Image.ViewportHeightRatio) ||
            item.Image.ViewportHeightRatio is <= 0 or > 1 ||
            item.Image.Alignment != "bottom")
        {
            throw new InvalidDataException($"Menu item '{item.Id}' has invalid image settings.");
        }
    }

    [GeneratedRegex("^[A-Za-z0-9._-]+$")]
    private static partial Regex SafePathSegmentRegex();
}
