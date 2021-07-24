################################################################################
#                                                                              #
#   Copyright (C) 2013, CoreBlox, LLC. All rights reserved                     #
#                                                                              #
#   LICENSE TEXT												               #
#                                                                              #
################################################################################
 
 
use Netegrity::PolicyMgtAPI;
 
 
#                                                                              #
# Global Variables															   #
#                                                                              #

# Store Admin Credentials
$policymgtapi = '';
$session = '';

# Domain Name
$domainname = '';

# Store Selected User Directory
$authuserdir = '';

# Store search string
$userdnlookup = '';

#                                                                              #
# End global variables			                                               #
#                                                                              #

if($^O eq 'MSWin32') { system('cls'); } else { system('clear');}

print "\n\n*********** CoreBlox Token Service Policy Server Installer  ***********\n";
print "\n";

#########################
# Get Admin Credentials #
#########################

getadmincreds();

# Clear screen to obscure password
if($^O eq 'MSWin32') { system('cls'); } else { system('clear');}


########################################
# Get Domain Name for CTS installation #
########################################

print "\n\nEnter unique CTS Domain Name\n";
print "--------------------------------\n";

getdomainname();

######################
# Get User Directory #
######################

print "\n\nSelect User Directory Used for Authenticating Users\n";
print "---------------------------------------------------\n";
    
getuserdirectory();

#########################
# Get User Search Query #
#########################
print "\n\nEnter the user lookup search query for locating users\n";
print "Use %{UID} for the user ID\n";
print "Optionally use %{DOMAIN} to further restrict the search\n";
print "For example: (sAMAccountName=%{UID})\n";
print "-----------------------------------------------------\n";

getuserdnlookup();

#######################################
# Confirm settings and create objects #
#######################################

if($^O eq 'MSWin32') { system('cls'); } else { system('clear');}
confirmsettings();

########################
# Done configuring CTS #
########################

print "\n\nThe configuration is now complete. Press the Enter key to exit.";
chomp($exit = <STDIN>);

if($exit == 999) {
	debug();
} else {
	exit(0);
}
 
#######
# Subroutines
####### 
 
sub getadmincreds {

    print "Enter Policy Server Administrator credentials\n";
    print "---------------------------------------------\n";
    print "Administrator ID: ";

	chomp($adminName = <STDIN>);
	
	print "Administrator Password: ";

	chomp($adminPwd = <STDIN>);

	$policymgtapi = Netegrity::PolicyMgtAPI->New();
	$session = $policymgtapi->CreateSession($adminName, $adminPwd);
 
    if($session == undef) {
        print "\nInvalid Credentials. Please try again.\n";
        getadmincreds();
    }

}


sub getdomainname{
	print "Name (or X to exit): ";
	chomp($name = <STDIN>);

	if(lc($name) eq "x") {
		exit(0);
	} elsif(length($name) > 0) {
		$domainname = $name;
	} else {
		print "No value entered. Please try again.\n\n\n";	
		getdomainname();		
	}
}

sub getuserdirectory {

	@userdirs=$session->GetAllUserDirs(); 
	$userdirssize=@userdirs;
	
	if(@userdirs != undef) {
		$counter = 1;	
		foreach $userdir(@userdirs) {
			print "[" . $counter . "] " . $userdir->Name() . "\n"; 
		
			$counter = $counter + 1;	
		}
	} else {
		die "No user directories configured. Please configure a user directory prior to running this installations script\n";
	}
	
    print "[X] Exit install script";
    print "\nEnter number or X to exit: ";
	    
	chomp($choice = <STDIN>);

	if(lc($choice) eq "x") {
		exit(0);
	} elsif ($choice eq $choice+0) {
		if($choice > $userdirssize) {
			print "Invalid choice. Please make another selection.\n\n\n";	
			getuserdirectory();
		} else {
			# Set authuserdir to user directory
			$authuserdir=$userdirs[$choice-1]->Name();
		}
	} else {
		print "Invalid choice. Please make another selection.\n\n\n";	
		getuserdirectory();		
	}
}

sub getuserdnlookup{
	print "User lookup (or X to exit): ";
	chomp($lookup = <STDIN>);

	if(lc($lookup) eq "x") {
		exit(0);
	} elsif(index($lookup, "%{UID}") > 0) {
		$userdnlookup = $lookup;
	} else {
		print "Query must contain '%{UID}'. Please try again.\n\n\n";	
		getuserdnlookup();		
	}
}

sub confirmsettings {

	print "\n\nConfirm Installation Parameters\n";
	print "-------------------------------\n";

	print "\n[1] CTS Domain Name: " . $domainname;
	print "\n[2] Selected User Directory: " . $authuserdir;
	print "\n[3] User search query: " . $userdnlookup;
	print "\nEnter [Y]es to continue, [X] to exit or number to modify value: ";

	chomp($choice = <STDIN>);

	if(lc($choice) eq "x") {
		exit(0);
	} elsif($choice eq "y" ) {
		createobjects();
	} elsif($choice == 1) {
		print "\nEnter Updated Value\n";
		print "---------------------\n";
		getdomainname();
		if($^O eq 'MSWin32') { system('cls'); } else { system('clear');}
		confirmsettings();
	} elsif($choice == 2) {
		print "\nEnter Updated Value\n";
		print "---------------------\n";
		getuserdirectory();
		if($^O eq 'MSWin32') { system('cls'); } else { system('clear');}
		confirmsettings();
	} elsif($choice == 3) {
		print "\nEnter Updated Value\n";
		print "---------------------\n";
		getuserdnlookup();
		if($^O eq 'MSWin32') { system('cls'); } else { system('clear');}
		confirmsettings();
	} else {
		print "Invalid choice. Please make another selection.\n\n\n";	
		confirmsettings();		
	}
}

sub createobjects {
	print "\nCreating CTS objects...";
	
	# Create Agent Object - coreblox_tokenservices_wa
	print "Creating CTS Agent Identity...";
	$agent = $session->CreateAgent( "coreblox_tokenservices_wa",
                                    $session->GetAgentType("Web Agent"),
                                    "CTS Agent Identity",
                                  );

    if(!defined $agent) {
        die "\nFATAL: Unable to create Agent\n";
    }
    print "Done\n";

	# Create User Attributes Auth Scheme
	print "Creating CTS User Attribute Authentication Scheme...";
	$uascheme = $session->CreateAuthScheme( "CTS User Attributes Authentication",
											$session->GetAuthScheme("Windows Authentication Template"),
											"CTS Authenitcation Scheme Used for User Attribute Authentication",
											5,
											"smauthntlm",
											$userdnlookup.";/siteminderagent/ntlm/creds.ntc;REL=1"
										  );

    if(!defined $uascheme) {
        die "\nFATAL: Unable to create User Attribute Authentication Scheme\n";
    }
    print "Done\n";
	
	# Create CTS Agent Configuration Oject
	print "Creating CTS Agent Configuration Object...";
	$aco = $session->CreateAgentConfig( "coreblox_tokenservices_aco",
										"CTS Agent Configuration Object"
									   );

    if(!defined $aco) {
        die "\nFATAL: Unable to create CTS Agent Configuration Object\n";
    }
    print "Done\n";
    
    # Add ACO Settings
	print "Adding CTS Agent Configuration Parameters...";
	$aco->AddAssociation( "#CookieDomain","",0);
	$aco->AddAssociation( "#CookieName","",0);
	$aco->AddAssociation( "#CookiePath","",0);
	$aco->AddAssociation( "#AgentName","",0);
	$aco->AddAssociation( "#DefaultAgentName","",0);
	$aco->AddAssociation( "#IdentityAttribute","",0);
	$aco->AddAssociation( "ServiceAgentName","coreblox_tokenservices_wa",0);
	$aco->AddAssociation( "DefaultAction","GET",0);
	$aco->AddAssociation( "ValidationResource","/vtokenresource",0);
 	$aco->AddAssociation( "password","/ptokenresource",0);
 	$aco->AddAssociation( "userAttributes","/uatokenresource",0);
	print "Done\n";

    # Get User Directory Connection
    print "Associating User Directory object...";
    $userdir=$session->GetUserDir($authuserdir);

 	if(!defined $userdir) {
        die "\nFATAL: Unable to get ".$authuserdir."\n";
    }
    print "Done\n";

	# Create Domain
	print "Creating CTS Configuration Domain - " . $domainname . "...";
    $domain = $session->CreateDomain(   $domainname,
                                        "CoreBlox Token Services Configuration Domain"
                                    );
                                    
    if(!defined $domain) {
        die "\nFATAL: Unable to create Domain\n";
    }

    $domain->AddUserDir($userdir);
    print "Done\n";

	# Create Realms
	print "Creating ptokenresource Realm...";
    $prealm = $domain->CreateRealm( "ptokenresource Realm",
                                    $agent,
                                    $session->GetAuthScheme("Basic"),
                                    "CTS Realm for Password Authentication",
                                    "/ptokenresource"
                                 );

    if(!defined $prealm) {
        die "\nFATAL: Unable to create ptokenresource Realm\n";
    }
    print "Done\n";

	print "Creating vtokenresource Realm...";
    $vrealm = $domain->CreateRealm( "vtokenresource Realm",
                                    $agent,
                                    $session->GetAuthScheme("Basic"),
                                    "CTS Realm for Validation",
                                    "/vtokenresource"
                                 );

    if(!defined $vrealm) {
        die "\nFATAL: Unable to create vtokenresource Realm\n";
    }
    print "Done\n";

	print "Creating uatokenresource Realm...";
    $uarealm = $domain->CreateRealm( "uatokenresource Realm",
                                    $agent,
                                    $uascheme,
                                    "CTS Realm for User Attributes Authentication",
                                    "/uatokenresource"
                                 );

    if(!defined $uarealm) {
        die "\nFATAL: Unable to create uatokenresource Realm\n";
    }
    print "Done\n";


	# Create Rule Objects
	print "Creating ptokentresource GET Rule...";
	
    $prule = $prealm->CreateRule( "ptokentresource GET Rule",
                                "/ptokentresource* Protected",
                                "GET",
                                "*"
                              );

    if(!defined $prule) {
        die "\nFATAL: Unable to create ptokentresource GET Rule\n";
    }

    print "Done\n";

	print "Creating vtokentresource GET Rule...";
	
    $vrule = $vrealm->CreateRule( "vtokentresource GET Rule",
                                "/vtokentresource* Protected",
                                "GET",
                                "*"
                              );

    if(!defined $vrule) {
        die "\nFATAL: Unable to create vtokentresource GET Rule\n";
    }

    print "Done\n";


	print "Creating uatokentresource GET Rule...";
	
    $uarule = $uarealm->CreateRule( "uatokentresource GET Rule",
                                "/uatokentresource* Protected",
                                "GET",
                                "*"
                              );

    if(!defined $uarule) {
        die "\nFATAL: Unable to create uatokentresource GET Rule\n";
    }

    print "Done\n";


	# Create Policy Object
	print "Creating CTS Policy...";
	
    $policy = $domain->CreatePolicy(    "CoreBlox Token Service Policy",
                                        "Map users to resources, define additional attributes and configure other CTS items"
                                   );

    if(!defined $policy) {
        die "\nFATAL: Unable to create CTS Policy\n";
    }

	# Add Rules
	print "Adding rules to CTS Policy...";
	$policy->AddRule($prule);
	$policy->AddRule($vrule);
	$policy->AddRule($uarule);
    print "Done\n";
    
    # Add ALL
    print "Add ALL users to CTS Policy...";

    $searchroot = $userdir->SearchRoot();
    $user = $userdir->LookupEntry($searchroot);
	$policy->AddUser($user);
    print "Done\n";
}

sub debug {

	# Remove created objects
    print "\nCleaning up...";
    $session->DeleteDomain($session->GetDomain($domainname));
    $session->DeleteAgentConfig($session->GetAgentConfig("coreblox_tokenservices_aco"));
    $session->DeleteAgent($session->GetAgent("coreblox_tokenservices_wa"));
    $session->DeleteAuthScheme($session->GetAuthScheme("CTS User Attributes Authentication"));
    print "Done\n";
}