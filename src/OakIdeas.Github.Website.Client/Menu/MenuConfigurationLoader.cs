using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace OakIdeas.Github.Website.Client.Menu;

public sealed class MenuConfigurationLoader(HttpClient httpClient)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public string DefaultItemId { get; private set; } = string.Empty;

    public async Task<IReadOnlyList<MenuItemConfiguration>> LoadMenuAsync(CancellationToken cancellationToken = default)
    {
        var configuration = await httpClient.GetFromJsonAsync<MenuConfiguration>("menu.json", JsonOptions, cancellationToken)
            ?? throw new InvalidDataException("The menu configuration is empty.");

        MenuConfigurationValidator.Validate(configuration);
        foreach (var item in configuration.Items)
        {
            var imageResponse = await httpClient.GetAsync(item.Image.Src, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            EnsureSuccess(imageResponse, item.Image.Src);

            if (item.Action.Type == "content")
            {
                var contentResponse = await httpClient.GetAsync(item.Action.ContentPath, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                EnsureSuccess(contentResponse, item.Action.ContentPath!);
            }
        }

        DefaultItemId = configuration.DefaultItemId;
        return configuration.Items.Where(item => item.Enabled).OrderBy(item => item.Order).ToArray();
    }

    public Task<string> LoadContentAsync(MenuItemConfiguration item, CancellationToken cancellationToken = default)
    {
        if (item.Action.Type != "content" || !MenuConfigurationValidator.IsSafeRelativePath(item.Action.ContentPath))
        {
            throw new InvalidDataException("The selected menu item does not reference safe HTML content.");
        }

        return httpClient.GetStringAsync(item.Action.ContentPath, cancellationToken);
    }

    private static void EnsureSuccess(HttpResponseMessage response, string path)
    {
        using (response)
        {
            if (response.StatusCode != HttpStatusCode.OK)
            {
                throw new InvalidDataException($"Referenced menu resource '{path}' could not be found.");
            }
        }
    }
}
