using GreenLedger.Application.Auth.Dtos;
using GreenLedger.Application.Batches.Dtos;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace GreenLedger.Api.IntegrationTests;

public sealed class AuthorizationPolicyTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.WithWebHostBuilder(builder => builder.UseSetting("environment", "Development"))
        .CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

    [Fact]
    public async Task AnonymousUser_CannotReadBatches()
    {
        var response = await _client.GetAsync("/api/batches");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CultivationOperator_CanCreateBatch_ButCannotChangeStatus()
    {
        var cultivationToken = await LoginAsync("camila.cultivation@greenledger.com", "GreenLedger123!");
        using var cultivationRequest = CreateAuthenticatedRequest(HttpMethod.Post, "/api/batches", cultivationToken);
        cultivationRequest.Content = JsonContent.Create(new CreateBatchRequestDto
        {
            BatchNumber = $"GL-AUTHZ-{Guid.NewGuid():N}"[..16],
            ProductName = "Policy Test Oil",
            CultivarName = "Control Plant"
        });

        using var createResponse = await _client.SendAsync(cultivationRequest);
        var createdBatch = await createResponse.Content.ReadFromJsonAsync<BatchSummaryDto>();

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.NotNull(createdBatch);

        using var statusRequest = CreateAuthenticatedRequest(HttpMethod.Patch, $"/api/batches/{createdBatch!.Id}/status", cultivationToken);
        statusRequest.Content = JsonContent.Create(new ChangeBatchStatusRequestDto
        {
            Status = "ReadyForRelease",
            Reason = "Cultivation should not approve release."
        });

        using var statusResponse = await _client.SendAsync(statusRequest);

        Assert.Equal(HttpStatusCode.Forbidden, statusResponse.StatusCode);
    }

    [Fact]
    public async Task QualityManager_CanChangeBatchStatus()
    {
        var cultivationToken = await LoginAsync("camila.cultivation@greenledger.com", "GreenLedger123!");
        var qualityToken = await LoginAsync("sofia.quality@greenledger.com", "GreenLedger123!");
        var batchId = await CreateBatchAsync(cultivationToken);

        using var statusRequest = CreateAuthenticatedRequest(HttpMethod.Patch, $"/api/batches/{batchId}/status", qualityToken);
        statusRequest.Content = JsonContent.Create(new ChangeBatchStatusRequestDto
        {
            Status = "OnHold",
            Reason = "Quality review requires investigation."
        });

        using var response = await _client.SendAsync(statusRequest);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Regulator_CanRead_AuditAndUsers_ButCannotCreateBatch()
    {
        var cultivationToken = await LoginAsync("camila.cultivation@greenledger.com", "GreenLedger123!");
        var regulatorToken = await LoginAsync("rita.regulator@gov.example", "GreenLedger123!");
        var batchId = await CreateBatchAsync(cultivationToken);

        using var auditRequest = CreateAuthenticatedRequest(HttpMethod.Get, $"/api/batches/{batchId}/audit", regulatorToken);
        using var auditResponse = await _client.SendAsync(auditRequest);

        using var usersRequest = CreateAuthenticatedRequest(HttpMethod.Get, "/api/users", regulatorToken);
        using var usersResponse = await _client.SendAsync(usersRequest);

        using var createRequest = CreateAuthenticatedRequest(HttpMethod.Post, "/api/batches", regulatorToken);
        createRequest.Content = JsonContent.Create(new CreateBatchRequestDto
        {
            BatchNumber = $"GL-DENY-{Guid.NewGuid():N}"[..15],
            ProductName = "Unauthorized Product",
            CultivarName = "N/A"
        });

        using var createResponse = await _client.SendAsync(createRequest);

        Assert.Equal(HttpStatusCode.OK, auditResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, usersResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, createResponse.StatusCode);
    }

    [Fact]
    public async Task CultivationOperator_CannotReadUserDirectory()
    {
        var cultivationToken = await LoginAsync("camila.cultivation@greenledger.com", "GreenLedger123!");
        using var request = CreateAuthenticatedRequest(HttpMethod.Get, "/api/users", cultivationToken);

        using var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private async Task<Guid> CreateBatchAsync(string token)
    {
        using var request = CreateAuthenticatedRequest(HttpMethod.Post, "/api/batches", token);
        request.Content = JsonContent.Create(new CreateBatchRequestDto
        {
            BatchNumber = $"GL-BATCH-{Guid.NewGuid():N}"[..16],
            ProductName = "Integration Test Product",
            CultivarName = "Integration Cultivar"
        });

        using var response = await _client.SendAsync(request);
        var createdBatch = await response.Content.ReadFromJsonAsync<BatchSummaryDto>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(createdBatch);

        return createdBatch!.Id;
    }

    private async Task<string> LoginAsync(string email, string password)
    {
        using var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequestDto
            {
                Email = email,
                Password = password
            });

        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(authResponse);

        return authResponse!.AccessToken;
    }

    private static HttpRequestMessage CreateAuthenticatedRequest(HttpMethod method, string uri, string token)
    {
        var request = new HttpRequestMessage(method, uri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }
}
