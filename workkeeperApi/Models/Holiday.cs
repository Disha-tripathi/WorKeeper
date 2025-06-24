using System.ComponentModel.DataAnnotations.Schema;

namespace workkeeperApi.Models;
[Table("Holiday")]
public class Holiday
{
    public int Id { get; set; }

    public DateTime HolidayDate { get; set; }

    public string? Name { get; set; }  // Optional holiday name
}
