using GreenLedger.Application.Abstractions;
using GreenLedger.Domain.Entities;
using GreenLedger.Infrastructure.Persistence;
using GreenLedger.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Identity;
using GreenLedger.Infrastructure.Auth;

namespace GreenLedger.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("GreenLedger");

        services.AddDbContext<GreenLedgerDbContext>(options =>
            options.UseNpgsql(connectionString));
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));

        services.AddScoped<PasswordHasher<UserAccount>>();
        services.AddSingleton<JwtTokenGenerator>();
        services.AddScoped<IBatchReadService, PostgresBatchReadService>();
        services.AddScoped<IBatchCommandService, PostgresBatchCommandService>();
        services.AddScoped<IDocumentService, PostgresDocumentService>();
        services.AddScoped<IUserReadService, PostgresUserReadService>();
        services.AddScoped<IAuditReadService, PostgresAuditReadService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ILocalDocumentStorage, LocalDocumentStorage>();
        services.AddScoped<DatabaseSeeder>();

        return services;
    }
}
