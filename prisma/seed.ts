import ms from "ms";
import { prisma } from "../src/utilities.js";


const studentRepository = prisma.student;
const guildRepository = prisma.guild;
const roleRepository = prisma.role;


const productionGuild = await guildRepository.create({
    data: {
        id: '922789917296308250'
    }
});

const adminRole = await roleRepository.create({
    data: {
        id: '922790090332327956',
        type: 'ADMIN',
        guild: {
            connect: productionGuild
        }
    }
});

const modRole = await roleRepository.create({
    data: {
        id: '922825391570305036',
        type: 'MOD',
        guild: {
            connect: productionGuild
        }
    }
});

const verifiedRole = await roleRepository.create({
    data: {
        id: '922799498080690217',
        type: 'VERIFIED',
        guild: {
            connect: productionGuild
        }
    }
});

const devRole = await roleRepository.create({
    data: {
        id: '929369321518563348',
        type: 'DEV',
        guild: {
            connect: productionGuild
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '181043083973099521',
        id: 'DMT2002036',
        name: 'Yim Jing Xiang',
        enrolledBatch: '2002',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }, {
                role: {
                    connect: {
                        id: modRole.id
                    }
                }
            }]
        },
        guilds: {
            connect: {
                id: productionGuild.id
            }
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '259744136842838017',
        id: 'DMT2004283',
        name: 'Sea Wei Ze',
        enrolledBatch: '2004',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }]
        },
        guilds: {
            connect: {
                id: productionGuild.id
            }
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '279132146998968321',
        id: 'DMT2004288',
        name: 'Tan Zhi Xian',
        enrolledBatch: '2004',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }]
        },
        guilds: {
            connect: {
                id: productionGuild.id
            }
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '334330696258682880',
        id: 'DMT2004286',
        name: 'Tan Pek Theng',
        enrolledBatch: '2004',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }]
        },
        guilds: {
            connect: {
                id: productionGuild.id
            }
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '343319108747526144',
        id: 'DMT2004281',
        name: 'Ng Ca Hoe',
        enrolledBatch: '2004',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }]
        },
        guilds: {
            connect: {
                id: productionGuild.id
            }
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '344127238884818954',
        id: 'DMT2002214',
        name: 'Ng Jia Iong',
        enrolledBatch: '2002',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }, {
                role: {
                    connect: {
                        id: modRole.id
                    }
                }
            }]
        },
        guilds: {
            connect: {
                id: productionGuild.id
            }
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '392436823349002240',
        id: 'DMT2002035',
        name: 'Siew Ee Shin',
        enrolledBatch: '2002',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }, {
                role: {
                    connect: {
                        id: adminRole.id
                    }
                }
            }, {
                role: {
                    connect: {
                        id: devRole.id
                    }
                }
            }]
        },
        guilds: {
            connect: {
                id: productionGuild.id
            }
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '455739877330255873',
        id: 'DMT2004284',
        name: 'Seh Fei Faye',
        enrolledBatch: '2004',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }, {
                role: {
                    connect: {
                        id: adminRole.id
                    }
                }
            }]
        },
        guilds: {
            connect: {
                id: productionGuild.id
            }
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '531834696552808448',
        id: 'DMT2004276',
        name: 'Chew Min Qian',
        enrolledBatch: '2004',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }, {
                role: {
                    connect: {
                        id: adminRole.id
                    }
                }
            }]
        },
        guilds: {
            connect: {
                id: productionGuild.id
            }
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '554646411828920330',
        id: 'DMT2002033',
        name: 'Heng Chi En',
        enrolledBatch: '2002',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }, {
                role: {
                    connect: {
                        id: adminRole.id
                    }
                }
            }]
        },
        guilds: {
            connect: {
                id: productionGuild.id
            }
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '605410278250774529',
        id: 'DMT2004277',
        name: 'Kelly Chu Kai Yii',
        enrolledBatch: '2004',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }]
        },
        guilds: {
            connect: {
                id: productionGuild.id
            }
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '694219407307833354',
        id: 'DMT2004289',
        name: 'Teh Hao Boon',
        enrolledBatch: '2004',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }, {
                role: {
                    connect: {
                        id: adminRole.id
                    }
                }
            }]
        },
        guilds: {
            connect: {
                id: productionGuild.id
            }
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '712529273717522502',
        id: 'DMT2004294',
        name: 'Pang Yanlin',
        enrolledBatch: '2004',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }]
        }, guilds: {
            connect: {
                id: productionGuild
            }.id
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '732205881785057350',
        id: 'DMT2004041',
        name: 'Chan Xin Jo',
        enrolledBatch: '2004',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }]
        }, guilds: {
            connect: {
                id: productionGuild
            }.id
        }
    }
});

await studentRepository.create({
    data: {
        discordId: '909505502050914334',
        id: 'DMT2002034',
        name: 'Pang Xiau Zhing',
        enrolledBatch: '2002',
        remindTime: ms(3600000),
        studentsToRoles: {
            create: [{
                role: {
                    connect: {
                        id: verifiedRole.id
                    }
                }
            }]
        }, guilds: {
            connect: {
                id: productionGuild
            }.id
        }
    }
});

await prisma.$disconnect();