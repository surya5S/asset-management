FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY AssetManagement.sln .
COPY AssetManagement.API/AssetManagement.API.csproj AssetManagement.API/
COPY AssetManagement.Application/AssetManagement.Application.csproj AssetManagement.Application/
COPY AssetManagement.Domain/AssetManagement.Domain.csproj AssetManagement.Domain/
COPY AssetManagement.Infrastructure/AssetManagement.Infrastructure.csproj AssetManagement.Infrastructure/

RUN dotnet restore

COPY . .
RUN dotnet publish AssetManagement.API/AssetManagement.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "AssetManagement.API.dll"]
