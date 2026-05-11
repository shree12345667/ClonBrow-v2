import time
import webbrowser
import os
import re
import random
import sys
import base64
from datetime import datetime
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

def ai_typewriter(text, delay=0.015):
    console.print("[bold dark_red]> CLONEXXA:[/bold dark_red] ", end="")
    for char in text:
        console.print(f"[bold red]{char}[/bold red]", end="")
        time.sleep(delay)
    print()

def build_system_registry():
    registry = {}
    current_dir = os.path.dirname(os.path.abspath(__file__))
    try:
        files = [f for f in os.listdir(current_dir) if f.endswith('.html')]
    except:
        files = []
    for file in files:
        clean_name = file.replace('.html', '').lower()
        registry[clean_name] = file
        words = re.split(r'[\s\-_]+', clean_name)
        for word in words:
            if len(word) >= 3:
                registry[word] = file 
    return registry, current_dir, files

def open_module(filename, directory):
    file_path = f"file://{os.path.join(directory, filename)}"
    webbrowser.open(file_path)

# ==========================================
# ENTERPRISE SECURITY LOGIN
# ==========================================
os.system('cls' if os.name == 'nt' else 'clear') 
console.print("[bold red]CLONVERSE OS : KERNEL BOOT SEQUENCE INITIATED[/bold red]")
time.sleep(0.5)

authorized = False
attempts = 3

while attempts > 0:
    console.print(f"\n[bold dark_red]ENTER ROOT PASSWORD ([/bold dark_red][bold red]{attempts} attempts remaining[/bold red][bold dark_red]):[/bold dark_red] ", end="")
    pwd = input()
    if pwd == "admin":
        console.print("[bold green]ACCESS GRANTED. DECRYPTING FILESYSTEM...[/bold green]")
        time.sleep(0.5)
        authorized = True
        break
    else:
        console.print("[bold blink red]ACCESS DENIED.[/bold blink red]")
        attempts -= 1

if not authorized:
    console.print("[bold red]SECURITY LOCKDOWN INITIATED. TERMINATING.[/bold red]")
    sys.exit()

# ==========================================
# UI BOOT SEQUENCE 
# ==========================================
os.system('cls' if os.name == 'nt' else 'clear') 

title_art = """
 ██████╗ ██╗      ██████╗ ███╗   ██╗██╗   ██╗███████╗██████╗ ███████╗███████╗
██╔════╝ ██║     ██╔═══██╗████╗  ██║██║   ██║██╔════╝██╔══██╗██╔════╝██╔════╝
██║      ██║     ██║   ██║██╔██╗ ██║██║   ██║█████╗  ██████╔╝███████╗█████╗  
██║      ██║     ██║   ██║██║╚██╗██║╚██╗ ██╔╝██╔══╝  ██╔══██╗╚════██║██╔══╝  
╚██████╗ ███████╗╚██████╔╝██║ ╚████║ ╚████╔╝ ███████╗██║  ██║███████║███████╗
 ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝
"""
console.print(Panel(title_art, style="bold red", border_style="dark_red", title="[blink]OS INITIALIZATION[/blink]"))
time.sleep(0.2)

ai_typewriter("Bypassing security protocols...")
ai_typewriter("Scanning local directory for system modules...")

system_files, active_dir, raw_files = build_system_registry()

table = Table(title="ACTIVE CLONVERSE MODULES", style="red", border_style="dark_red", title_style="bold red")
table.add_column("Index", justify="center", style="dark_red", no_wrap=True)
table.add_column("Module Name (File)", style="bold red")
table.add_column("Status", justify="center", style="bold green")

for idx, file in enumerate(raw_files[:10]):
    table.add_row(f"0x{idx:02X}", file, "ONLINE")
if len(raw_files) > 10:
    table.add_row("...", f"+ {len(raw_files) - 10} more modules hidden", "ONLINE")

print()
console.print(table)
print()

ai_typewriter(f"Scan complete. {len(raw_files)} modules indexed and ready.")
ai_typewriter("AI routing protocol online. Type 'help' to see commands.")

start_time = time.time()

# ==========================================
# THE MAIN COMMAND LOOP (16 FEATURES)
# ==========================================
while True:
    print()
    console.print("[bold dark_red]ROOT@CLONVERSE[/bold dark_red][bold red] ~ #[/bold red] ", end="")
    user_input = input().strip().lower()

    # FEATURE 1: EXIT
    if user_input in ['exit', 'quit']:
        ai_typewriter("Shutting down Clonverse OS. Goodbye, Shree.")
        break
        
    # FEATURE 2: HELP MENU
    elif user_input == 'help':
        console.print(Panel(
            "[bold dark_red]01.[/bold dark_red] [bold]open [name][/bold]  : Launches a specific local HTML module.\n"
            "[bold dark_red]02.[/bold dark_red] [bold]cast app[/bold]     : Establishes uplink to live Netlify Cloud App.\n"
            "[bold dark_red]03.[/bold dark_red] [bold]boot gui[/bold]     : Launches the standalone Clonverse Desktop App.\n"
            "[bold dark_red]04.[/bold dark_red] [bold]netstat[/bold]      : Runs a live IBM mainframe network trace.\n"
            "[bold dark_red]05.[/bold dark_red] [bold]status[/bold]       : Displays OS diagnostic telemetry.\n"
            "[bold dark_red]06.[/bold dark_red] [bold]plan[/bold]         : Generates an AI-curated study curriculum.\n"
            "[bold dark_red]07.[/bold dark_red] [bold]hex [file][/bold]   : Inspects a file's raw hex memory architecture.\n"
            "[bold dark_red]08.[/bold dark_red] [bold]clear[/bold]        : Clears the terminal cache.\n"
            "[bold dark_red]09.[/bold dark_red] [bold]whoami[/bold]       : Displays current user authorization level.\n"
            "[bold dark_red]10.[/bold dark_red] [bold]sysinfo[/bold]      : Displays detailed hardware configuration.\n"
            "[bold dark_red]11.[/bold dark_red] [bold]firewall[/bold]     : Simulates cyber-defense packet blocking.\n"
            "[bold dark_red]12.[/bold dark_red] [bold]matrix[/bold]       : Initiates visual data-stream analysis.\n"
            "[bold dark_red]13.[/bold dark_red] [bold]encrypt [txt][/bold]: Encrypts a string of text.\n"
            "[bold dark_red]14.[/bold dark_red] [bold]decrypt [txt][/bold]: Decrypts a secure string.\n"
            "[bold dark_red]15.[/bold dark_red] [bold]ibm x unsa[/bold]   : Validates IBM Z Mainframe Hackathon Link.\n"
            "[bold dark_red]16.[/bold dark_red] [bold]exit[/bold]         : Shutdown system.",
            title="SYSTEM COMMANDS (16 ACTIVE)", border_style="dark_red", style="red"
        ))
        continue

    # FEATURE 3: OPEN MODULE (DYNAMIC)
    elif any(trigger in user_input for trigger in ["open", "play", "start", "launch", "run"]):
        found = False
        sorted_keywords = sorted(system_files.keys(), key=len, reverse=True)
        for keyword in sorted_keywords:
            if keyword in user_input:
                target_file = system_files[keyword]
                ai_typewriter(f"Deploying module -> {target_file}")
                open_module(target_file, active_dir)
                found = True
                break 
        if not found:
            ai_typewriter("Module not found. Ensure spelling is correct.")

    # FEATURE 4: CAST APP (NETLIFY)
    elif user_input == 'cast app' or user_input == 'uplink':
        ai_typewriter("Establishing secure external uplink to live server...")
        time.sleep(0.5)
        webbrowser.open("https://phenomenal-genie-a7ea74.netlify.app/")
        console.print(Panel("[bold green]UPLINK SUCCESSFUL. Live Web App deployed.[/bold green]", border_style="green"))

    # FEATURE 5: BOOT GUI
    elif user_input == 'boot gui':
        ai_typewriter("Transferring control to Graphical User Interface...")
        ai_typewriter("Scanning for compiled Nativefier binaries...")
        app_launched = False
        for item in os.listdir(active_dir):
            if os.path.isdir(item) and "Clonverse" in item:
                linux_exe = os.path.join(item, "Clonverse OS")
                if os.path.exists(linux_exe):
                    os.system(f'"{linux_exe}" &') 
                    app_launched = True
                    break
        if app_launched:
            console.print(Panel("[bold green]GUI DEPLOYED SUCCESSFULLY.[/bold green]", border_style="green"))
        else:
            ai_typewriter("ERROR: Nativefier build not found. Use 'cast app' instead.")

    # FEATURE 6: NETSTAT
    elif user_input == 'netstat':
        ai_typewriter("Pinging IBM Z Mainframe nodes...")
        time.sleep(0.5)
        for i in range(25):
            ip = f"192.168.{random.randint(1,255)}.{random.randint(1,255)}"
            console.print(f"[dark_red]Tracing route to[/dark_red] [red]{ip}:{random.choice([80, 443, 8080])}[/red] [dark_red]... Latency: {random.randint(5, 45)}ms[/dark_red]")
            time.sleep(0.05)
        console.print(Panel("[bold green]NETWORK TRACE COMPLETE. UPLINK STABLE.[/bold green]", border_style="green"))

    # FEATURE 7: STATUS
    elif user_input == 'status':
        uptime = round(time.time() - start_time, 1)
        status_text = (
            f"[bold red]System Time:[/bold red] {datetime.now().strftime('%H:%M:%S')}\n"
            f"[bold red]Session Uptime:[/bold red] {uptime} seconds\n"
            f"[bold red]Indexed Modules:[/bold red] {len(raw_files)}\n"
            f"[bold red]Neural Link:[/bold red] [bold green]STABLE[/bold green]"
        )
        console.print(Panel(status_text, title="SYSTEM DIAGNOSTICS", border_style="dark_red", style="red"))

    # FEATURE 8: PLAN (AI CURRICULUM)
    elif user_input == 'plan':
        if len(raw_files) < 3:
            ai_typewriter("Insufficient modules.")
            continue
        ai_typewriter("Analyzing user metrics...")
        time.sleep(0.5)
        curriculum = random.sample(raw_files, 3)
        plan_table = Table(title="AI CURRICULUM", style="red", border_style="dark_red")
        plan_table.add_column("Phase", style="dark_red")
        plan_table.add_column("Task", style="bold red")
        plan_table.add_row("1. Warmup", curriculum[0])
        plan_table.add_row("2. Core Study", curriculum[1])
        plan_table.add_row("3. Application", curriculum[2])
        console.print(plan_table)

    # FEATURE 9: HEX DUMP
    elif user_input.startswith("hex "):
        target_file = user_input.split("hex ")[1].strip()
        if os.path.exists(target_file):
            ai_typewriter(f"Extracting raw memory dump of {target_file}...")
            time.sleep(0.5)
            try:
                with open(target_file, 'rb') as f:
                    chunk = f.read(128)
                    hex_data = ' '.join([f"{b:02X}" for b in chunk])
                    console.print(Panel(f"[red]{hex_data}[/red]", title=f"HEX DUMP: {target_file}", border_style="dark_red"))
            except:
                ai_typewriter("Access denied.")
        else:
            ai_typewriter("Target file not found.")

    # FEATURE 10: CLEAR
    elif user_input == 'clear':
        os.system('cls' if os.name == 'nt' else 'clear')
        console.print("[bold red]Terminal cache cleared.[/bold red]")

    # FEATURE 11: WHOAMI
    elif user_input == 'whoami':
        console.print(Panel("[bold green]USER: SHREE\nAUTHORIZATION: ROOT / SYSADMIN\nACCESS LEVEL: MAXIMUM[/bold green]", border_style="green"))

    # FEATURE 12: SYSINFO
    elif user_input == 'sysinfo':
        info = (
            "[bold red]ARCHITECTURE:[/bold red] IBM Z / Solana Virtual Node\n"
            "[bold red]CLUSTER STATUS:[/bold red] Mainnet-Beta Link Active\n"
            "[bold red]TPS CAPACITY:[/bold red] 65,000 Logic Ops/sec\n"
            "[bold red]SECURITY:[/bold red] SHA-256 Root Encryption"
        )
        console.print(Panel(info, title="NODE TELEMETRY", border_style="dark_red"))

    # FEATURE 13: FIREWALL
    elif user_input == 'firewall':
        ai_typewriter("Initializing Cyber-Defense Grid...")
        for _ in range(15):
            ip = f"{random.randint(11,99)}.{random.randint(100,255)}.0.1"
            console.print(f"[bold red]BLOCKED INCOMING THREAT FROM:[/bold red] {ip} [bold green](DEFLECTED)[/bold green]")
            time.sleep(0.1)
        ai_typewriter("System secure. 0 breaches detected.")

    # FEATURE 14: MATRIX
    elif user_input == 'matrix':
        ai_typewriter("Injecting data stream...")
        try:
            for _ in range(40):
                stream = "".join(str(random.randint(0,1)) for _ in range(60))
                console.print(f"[bold green]{stream}[/bold green]")
                time.sleep(0.02)
        except KeyboardInterrupt:
            pass

    # FEATURE 15: ENCRYPT / DECRYPT
    elif user_input.startswith("encrypt "):
        msg = user_input.split("encrypt ")[1]
        enc = base64.b64encode(msg.encode()).decode()
        console.print(Panel(f"[bold green]ENCRYPTED HASH:[/bold green] {enc}", border_style="dark_red"))
        
    elif user_input.startswith("decrypt "):
        msg = user_input.split("decrypt ")[1]
        try:
            dec = base64.b64decode(msg.encode()).decode()
            console.print(Panel(f"[bold green]DECRYPTED TEXT:[/bold green] {dec}", border_style="dark_red"))
        except:
            ai_typewriter("ERROR: Invalid hash sequence.")
            
    # FEATURE 16: IBM X UNSA HACKATHON LINK
    elif user_input == 'ibm x unsa':
        ai_typewriter("Initiating Secure Handshake with IBM Z Mainframe...")
        time.sleep(0.5)
        console.print("[bold yellow]Authenticating via UNSA Gateway...[/bold yellow]")
        time.sleep(1)
        console.print("[bold green]AUTH SUCCESS: Team Profile Validated.[/bold green]")
        
        ibm_table = Table(title="IBM Z x UNSA ENVIRONMENT STATUS", style="red", border_style="dark_red")
        ibm_table.add_column("Telemetry", style="dark_red")
        ibm_table.add_column("Value", style="bold red")
        
        ibm_table.add_row("Target Architecture", "IBM z/OS (s390x)")
        ibm_table.add_row("Hackathon Track", "Machine Learning / AI")
        ibm_table.add_row("Environment", "LinuxONE Secure Container")
        ibm_table.add_row("Project Name", "ClonBrow v2")
        ibm_table.add_row("Developer", "Shree (SysAdmin)")
        ibm_table.add_row("Deployment Status", "READY FOR JUDGING")
        
        print()
        console.print(ibm_table)
        console.print(Panel("[bold green]ENTERPRISE MAINFRAME LINK ESTABLISHED. GOOD LUCK![/bold green]", border_style="green"))

    else:
        ai_typewriter("Command not recognized. Type 'help' for available directives.")