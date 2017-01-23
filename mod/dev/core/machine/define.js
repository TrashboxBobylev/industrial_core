var MachineRegistry = {
	machineIDs: {},
	
	isMachine: function(id){
		return this.machineIDs[id];
	},
	
	quickCoordAccess: {},
	
	addMacineAccessAtCoords: function(x, y, z, machine){
		this.quickCoordAccess[x + ":" + y + ":" + z] = machine;
	},
	
	removeMachineAccessAtCoords: function(x, y, z){
		delete this.quickCoordAccess[x + ":" + y + ":" + z];
	},
	
	accessMachineAtCoords: function(x, y, z){
		return this.quickCoordAccess[x + ":" + y + ":" + z];
	},
	
	registerPrototype: function(id, Prototype){
		// register render
		ICRenderLib.registerAsConnector(id);
		// register ID
		this.machineIDs[id] = true;
		// set base for web object
		Prototype.web = null;
		// setup energy value
		if (Prototype.defaultValues){
			Prototype.defaultValues.energy = 0;
		}
		else{
			Prototype.defaultValues = {
				energy: 0
			};
		}
		// copy functions
		if (Prototype.tick){
			Prototype.mechTick = Prototype.tick;
		}
		else if (!Prototype.mechTick){
			Prototype.mechTick = function(){};
		}
		if (Prototype.init){
			Prototype.mechInit = Prototype.init;
		}
		else if (!Prototype.mechInit){
			Prototype.mechInit = function(){};
		}
		if (Prototype.destroy){
			Prototype.mechDestroy = Prototype.destroy;
		}
		else if (!Prototype.mechDestroy){
			Prototype.mechDestroy = function(){};
		}
		if (!Prototype.energyTick){
			Prototype.energyTick = function(){};
		}
		if (!Prototype.getEnergyStorage){
			Prototype.getEnergyStorage = function(){
				return 0;
			};
		}
		// set default functions
		Prototype.init = function(){
			MachineRegistry.addMacineAccessAtCoords(this.x, this.y, this.z, this);
			// TODO: reload webs, apply to energy web
			EnergyWebBuilder.postWebRebuild();
			this.mechInit();
		}
		Prototype.tick = function(){
			if (!this.web){
				EnergyWebBuilder.rebuildFor(this);
			}
			else{
				this.energyTick(this.web);
			}
			this.mechTick();
		}
		Prototype.destroy = function(){
			if (this.web){
				this.web.removeMachine(this);
			}
			MachineRegistry.removeMachineAccessAtCoords(this.x, this.y, this.z);
			EnergyWebBuilder.postWebRebuild();
			this.mechDestroy();
		}
		
		TileEntity.registerPrototype(id, Prototype);
	},
	
	executeForAll: function(func){
		for (var key in this.quickCoordAccess){
			var mech = this.quickCoordAccess[key];
			if (mech){
				func(mech);
			}
		}
	},
	
	// standart functions
	basicEnergyReceiveFunc: function(){
		var energyNeed = this.getEnergyStorage() - this.data.energy;
		this.data.energy += this.web.requireEnergy(energyNeed);
	},
	//wrench descriptions for standard machines
	StandardDescriptions: {
		ENERGY_STORAGE: {
			energy: {
				description: "Energy storage",
				value: function(){
					return this.data.energy + "/" + this.getEnergyStorage()
				}
			},
			transfer: {
				description: "Input/output",
				value: function(){
					return this.data.TRANSFER + "Eu/t"
				}
			}
		},
		GENERATOR: {
			burning_scale: {
				description: "Fuel scale",
				value: function(){
					return Math.floor((this.data.burn / this.data.burnMax) * 100) + "%"
				}
			},
			energy_storage: {
				description: "Energy storage",
				value: function(){
					return this.data.energy + "/" + this.getEnergyStorage()
			}
		}
	},
	PROCESSING_MACHINE: {
		processing_item: {
			description: "Processing item",
			value: function(){
				return this.data.result.id + ", " + this.data.result.data
			}
		},
		progress: {
			description: "Progress",
			value: function(){
				return Math.floor((this.data.progress / this.data.maxProgress) * 100)
			}
		},
		energy_storage: {
			description: "Energy storage",
			value: function(){
				 return this.data.energy + "/" + this.getEnergyStorage()
			}
		}
	}
}
}

Callback.addCallback("LevelLoaded", function(){
	MachineRegistry.quickCoordAccess = {};
});

