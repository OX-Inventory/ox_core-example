import { oxmysql as MySQL } from "@overextended/oxmysql";
import {
  GetPlayer,
  GetPlayers,
  CreateVehicle,
  GetVehicleFromNetId,
} from "@overextended/ox_core/server";

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {
  // Get an array containing all players as instances of CPlayer.
  const players = GetPlayers();

  // Get the first entry
  const player = players[0];

  if (player) {
    // Print the object, containing their identity, ids, phone number, etc.
    console.log(player);

    // Set 'police' to a random grade.
    player.setGroup("police", getRandomInt(0, 5));

    // Get the new grade and print it.
    const group = player.getGroup("police");
    console.log(player.source, "police grade:", group);

    // Retrieve all player metadata. These values are stored separately from the standard 'player' object.
    const data = player.get();
    console.log(data);

    // Retrieve the player's discord id from metadata.
    const discord = player.get("discord");
    console.log(discord);

    // This can create a new persistent vehicle, owned by the player.
    // const vehicle = CreateVehicle({
    //     model: 'sultanrs',
    //     owner: player.charid,
    // }, player.getCoords(), GetEntityHeading(player.ped))
  }
})();

(async () => {
  // Get an array containing all players in the police or sheriff groups, with grade 3 or higher.
  const players = GetPlayers({
    groups: { sheriff: 3, police: 3 },
  });

  console.log(players);
})();

RegisterCommand(
  "getveh",
  async (source: number) => {
    const player = source > 0 && GetPlayer(source);
    if (!player) return;

    // Fetch a vehicle owned by the player from the database.
    const vehicleId = <number>(
      await MySQL.scalar(
        "SELECT id FROM vehicles WHERE owner = ? AND stored IS NOT NULL LIMIT 1",
        [player.charId]
      )
    );

    if (vehicleId) {
      const coords = player.getCoords();

      // Spawn it
      const vehicle = await CreateVehicle(
        vehicleId,
        [coords[0], coords[1] + 3.0, coords[2] + 1.0],
        GetEntityHeading(player.ped)
      );

      if (vehicle) {
        // Print the vehicle object.
        console.log(vehicle);

        // Print the vehicle metadata.
        console.log(vehicle.get());

        console.log(vehicle.getCoords());
      }
    }
  },
  false
);

onNet(
  "saveProperties",
  function (netid: number, data: Record<string, unknown>) {
    const vehicle = GetVehicleFromNetId(netid);
    if (!vehicle) return;

    vehicle.set("properties", data);
    vehicle.setStored("impound", true);
  }
);

setInterval(() => {
  const player = GetPlayers()[0];

  if (player) {
    // Set a random number for the "test" metadata property, and replicate to client.
    player.set("test", getRandomInt(1, 100), true);
  }
});
