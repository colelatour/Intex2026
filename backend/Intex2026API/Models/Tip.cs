using System;

namespace Intex2026API.Models;

public class Tip
{
    public int TipId { get; set; }

    public string? Name { get; set; }

    public string? Email { get; set; }

    public string? Region { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public bool Contacted { get; set; }
}
