var builder = DistributedApplication.CreateBuilder(args);

builder.AddProject<Projects.OakIdeas_Github_Website_Client>("website")
    .WithExternalHttpEndpoints();

builder.Build().Run();
